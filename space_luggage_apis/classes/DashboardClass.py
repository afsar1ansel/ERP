# File: DashboardClass.py
from db import db
from sqlalchemy.sql import text
from datetime import datetime,timedelta

class DashboardClass:
    def get_low_stock(self, limit=8):
        """Return dict with raw_materials and finished_goods lists (as dict rows)."""
        with db.engine.connect() as conn:
            raw_sql = text('''
                            SELECT 
                                rm.id,
                                rm.material_code,
                                rm.material_name,
                                rm.stock_qty,
                                rm.min_stock_level,
                                rm.unit_of_measure,
                                rm.stock_status,
                                rm.max_stock_level,
                                v.vendor_name
                            FROM raw_materials rm
                            LEFT JOIN vendors v ON rm.vendor_id = v.id
                            WHERE rm.status = 1 AND rm.stock_qty < rm.min_stock_level
                            ORDER BY (rm.min_stock_level - rm.stock_qty) DESC
                            LIMIT :lim
                        ''')
            raw_rows = conn.execute(raw_sql, {'lim': limit}).mappings().all()

            fg_sql = text('''SELECT *
                             FROM finished_goods
                             WHERE status = 1 AND stock_qty <= min_level
                             ORDER BY (min_level - stock_qty) DESC
                             LIMIT :lim''')
            fg_rows = conn.execute(fg_sql, {'lim': limit}).mappings().all()

        return {
            'raw_materials': [dict(r) for r in raw_rows],
            'finished_goods': [dict(f) for f in fg_rows]
        }

    def get_critical_production(self):
        """
        Return all production batches that have passed their expected_completion_date
        and are not completed. 
        """
        with db.engine.connect() as conn:
            sql = text('''
                SELECT
                    pb.id,
                    pb.production_code,
                    pb.product_id,
                    COALESCE(fg.product_name, CONCAT('Product #', pb.product_id)) AS product_name,
                    pb.client_id,
                    COALESCE(c.client_name, CONCAT('Client #', pb.client_id)) AS client_name,
                    pb.planned_qty,
                    pb.completed_qty,
                    pb.batch_status,
                    pb.expected_completion_date,
                    
                    'In Progress' AS current_stage,
                    
                    -- progress: completed_qty / planned_qty * 100
                    COALESCE(
                        CASE WHEN pb.planned_qty IS NOT NULL AND pb.planned_qty > 0
                            THEN ROUND((pb.completed_qty / pb.planned_qty) * 100, 2)
                            ELSE 0.0
                        END,
                        0.0
                    ) AS progress_percentage,
                    
                    -- simple risk heuristic (overdue => Critical)
                    CASE
                    WHEN pb.expected_completion_date < CURDATE() AND pb.batch_status != 'completed' THEN 'Critical'
                    WHEN pb.expected_completion_date <= DATE_ADD(CURDATE(), INTERVAL 2 DAY) AND pb.batch_status != 'completed' THEN 'High'
                    ELSE 'Normal'
                    END AS risk
                FROM production_batch pb
                LEFT JOIN finished_goods fg ON pb.product_id = fg.id
                LEFT JOIN clients c ON pb.client_id = c.id
                WHERE pb.expected_completion_date < CURDATE()
                AND pb.batch_status != 'completed'
                ORDER BY pb.expected_completion_date ASC

            ''')

            rows = conn.execute(sql).mappings().all()

        # normalize results
        result = []
        for r in rows:
            result.append({
                'id': r['id'],
                'production_code': r['production_code'],
                'product_id': r['product_id'],
                'product_name': r.get('product_name'),
                'client_id': r.get('client_id'),
                'client_name': r.get('client_name'),
                'planned_qty': float(r['planned_qty']) if r['planned_qty'] is not None else None,
                'completed_qty': float(r['completed_qty']) if r['completed_qty'] is not None else None,
                'batch_status': r.get('batch_status'),
                'expected_completion_date': r.get('expected_completion_date').strftime("%Y-%m-%d") if r.get('expected_completion_date') is not None else None,
                'current_stage': r.get('current_stage'),
                'progress_percentage': float(r['progress_percentage']) if r['progress_percentage'] is not None else 0.0,
                'risk': r.get('risk')
            })
        return result


    def get_recent_activities(self, since_days=7, limit=50):
        """Return recent activities across GRN, PO, QC, PROD, CONSUME as list of dicts."""
        since_ts = datetime.now() - timedelta(days=since_days)
        since_str = since_ts.strftime("%Y-%m-%d %H:%M:%S")
        with db.engine.connect() as conn:
            sql = text(''' 
                SELECT activity_type, activity_id, ref, extra, created_at, status
                FROM (
                    -- GRN (Goods Receipt Note) -> vendor_stock_receipts (return vendor name)
                    SELECT 
                        'GRN' AS activity_type,
                        g.id AS activity_id, 
                        g.grn_number AS ref,
                        COALESCE(v.vendor_name, CONCAT('Vendor #', g.vendor_id)) AS extra,
                        g.created_at,
                        g.status
                    FROM vendor_stock_receipts g
                    LEFT JOIN vendors v ON g.vendor_id = v.id
                    WHERE g.created_at >= :since

                    UNION ALL

                    -- PO (Purchase Order) -> purchase_orders (return vendor name)
                    SELECT 
                        'PO' AS activity_type, 
                        p.id AS activity_id, 
                        p.po_number AS ref,
                        COALESCE(v.vendor_name, CONCAT('Vendor #', p.vendor_id)) AS extra,
                        p.created_at, 
                        p.po_status AS status
                    FROM purchase_orders p
                    LEFT JOIN vendors v ON p.vendor_id = v.id
                    WHERE p.created_at >= :since

                    UNION ALL

                    -- QC (Quality Check) -> qc_records (prefer item_name; fallback to product/batch)
                    SELECT
                        'QC' AS activity_type,
                        q.id AS activity_id,
                        q.qc_code AS ref,
                        COALESCE(
                            NULLIF(q.item_name, ''),
                            fg.product_name,
                            pb.production_code,
                            CONCAT('Item #', q.entity_id)
                        ) AS extra,
                        q.created_at,
                        q.status
                    FROM qc_records q
                    LEFT JOIN finished_goods fg ON (q.entity_type = 'finished_good' AND q.entity_id = fg.id)
                    LEFT JOIN production_batch pb ON (q.entity_type = 'production_batch' AND q.entity_id = pb.id)
                    WHERE q.created_at >= :since

                    UNION ALL

                    -- PROD (Production) -> production_batch (return finished product name)
                    SELECT 
                        'PROD' AS activity_type,
                        pb.id AS activity_id,
                        pb.production_code AS ref,
                        COALESCE(fg.product_name, CONCAT('Product #', pb.product_id)) AS extra,
                        pb.created_at, 
                        pb.batch_status AS status
                    FROM production_batch pb
                    LEFT JOIN finished_goods fg ON pb.product_id = fg.id
                    WHERE pb.created_at >= :since

                    UNION ALL

                    -- RMCR (Raw Material Consumption Receipt) -> return production_code (human readable)
                    SELECT 
                        'CONSUME' AS activity_type,
                        r.id AS activity_id, 
                        CONCAT('RMCR-', r.id) AS ref,
                        COALESCE(pb.production_code, CONCAT('Batch #', r.production_batch_id)) AS extra,
                        r.created_at,
                        r.status
                    FROM raw_material_consumption_receipt r
                    LEFT JOIN production_batch pb ON r.production_batch_id = pb.id
                    WHERE r.created_at >= :since
                ) t
                ORDER BY created_at DESC
                LIMIT :lim
            ''')

            rows = conn.execute(sql, {'since': since_str, 'lim': limit}).mappings().all()
        return [dict(r) for r in rows]
    
    def get_dashboard_stats(self):
        """
        Returns a dictionary of key dashboard statistics:
        1. total_production: SUM of all received_qty from production_receipts.
        2. low_stock_alerts: COUNT of all items below min stock.
        3. qc_pass_rate: Percentage of 'pass' vs *all* QC records.
        4. avg_vendor_on_time: AVG of on_time_percentage from active vendors.
        """
        with db.engine.connect() as conn:
            
            # 1. Total Product Quantity
            prod_sql = text("""
                SELECT COALESCE(SUM(received_qty), 0) 
                FROM production_receipts
            """)
            total_production = conn.execute(prod_sql).scalar()

            # 2. Low Stock Alerts Count
            low_stock_sql = text("""
                SELECT 
                    (SELECT COUNT(*) FROM raw_materials WHERE status = 1 AND stock_qty < min_stock_level) +
                    (SELECT COUNT(*) FROM finished_goods WHERE status = 1 AND stock_qty <= min_level)
            """)
            total_low_stock = conn.execute(low_stock_sql).scalar()
            
            # 3. QC Pass Rate % (CORRECTED)
            # Calculates (Pass / Total Records) * 100. Handles division by zero.
            qc_sql = text("""
                SELECT 
                    COALESCE(
                        (COUNT(CASE WHEN result = 'pass' THEN 1 END) * 100.0) 
                        / NULLIF(COUNT(id), 0),
                        0
                    ) AS qc_pass_rate
                FROM qc_records
            """)
            qc_pass_rate = conn.execute(qc_sql).scalar()

            # 4. Vendor On-Time %
            # Averages the 'on_time_percentage' for all active vendors
            vendor_sql = text("""
                SELECT COALESCE(AVG(on_time_percentage), 0) 
                FROM vendors 
                WHERE status = 1
            """) # Assuming status=1 means active
            avg_vendor_on_time = conn.execute(vendor_sql).scalar()

        return {
            'total_production': float(total_production),
            'low_stock_alerts': int(total_low_stock),
            'qc_pass_rate': round(float(qc_pass_rate), 2),
            'avg_vendor_on_time': round(float(avg_vendor_on_time), 2)
        }


# instantiate for import
dashboardObj = DashboardClass()
