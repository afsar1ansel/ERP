import os
import re
import json
import requests
from typing import Dict, List, Any, Tuple
from flask import Blueprint, request, jsonify

from db import db
from sqlalchemy.sql import text

# Initialize Blueprint for AI Chat endpoints
ai_chat_blueprint = Blueprint("ai_chat", __name__)

# Configurable constants for Ollama LLM endpoint
OLLAMA_ENDPOINT: str = os.getenv("OLLAMA_ENDPOINT", "http://147.93.18.205:11434/api/generate")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:1.5b")
REQUEST_TIMEOUT_SECONDS: int = 90
DEFAULT_SQL_LIMIT: int = 50


# Database Schema context provided to the LLM for Text-to-SQL generation
DB_SCHEMA: str = """
-- MySQL Database Schema Context for Smart Manufacturing ERP

CREATE TABLE production_batch (
    id INT PRIMARY KEY AUTO_INCREMENT,
    production_code VARCHAR(50),
    product_id INT, -- Foreign key to finished_goods.id
    planned_qty DECIMAL(18,4),
    completed_qty DECIMAL(18,4),
    client_id INT, -- Foreign key to clients.id
    floor INT,
    expected_completion_date DATETIME,
    batch_status VARCHAR(30), -- 'planned', 'in_progress', 'completed'
    priority INT,
    status TINYINT -- 1 = active
);

CREATE TABLE finished_goods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255),
    sku_code VARCHAR(100),
    brand_id INT,
    product_category_id INT,
    stock_qty DECIMAL(18,4),
    min_level DECIMAL(18,4),
    max_level DECIMAL(18,4),
    unit_price DECIMAL(18,2),
    total_value DECIMAL(18,2),
    goods_status VARCHAR(30), -- 'in_stock', 'low_stock'
    status TINYINT -- 1 = active
);

CREATE TABLE raw_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_code VARCHAR(50),
    material_name VARCHAR(255),
    raw_material_category_id INT,
    stock_qty DECIMAL(10,2),
    unit_of_measure VARCHAR(50),
    unit_cost DECIMAL(12,2),
    total_value DECIMAL(14,2),
    stock_status VARCHAR(50), -- 'in_stock', 'low_stock'
    status TINYINT -- 1 = active
);

CREATE TABLE vendors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_name VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(30),
    email VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    status TINYINT -- 1 = active
);

CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_code VARCHAR(50),
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    department_id INT,
    role VARCHAR(100),
    emp_status VARCHAR(30), -- 'active'
    status TINYINT -- 1 = active
);

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_code VARCHAR(50),
    client_id INT, -- Foreign key to clients.id
    product_sku_id INT, -- Foreign key to finished_goods.id
    quantity DECIMAL(10,2),
    order_status VARCHAR(50), -- 'pending', 'processing', 'completed'
    expected_delivery_date DATE,
    status TINYINT -- 1 = active
);

CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(255),
    contact_person VARCHAR(255),
    client_type VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    billing_address TEXT,
    billing_addr_city VARCHAR(100),
    billing_addr_state VARCHAR(100),
    status TINYINT -- 1 = active
);

CREATE TABLE dispatch_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dispatch_id VARCHAR(50),
    order_reference VARCHAR(100),
    customer_id INT, -- Foreign key to clients.id
    shipping_address TEXT,
    no_of_boxes INT,
    grand_total DECIMAL(14,2),
    tracking VARCHAR(100),
    dispatch_status VARCHAR(50), -- 'pending', 'completed'
    dispatch_date DATE,
    status TINYINT -- 1 = active
);

CREATE TABLE qc_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    qc_code VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    item_name VARCHAR(255),
    inspector_name VARCHAR(255),
    test_type_id INT,
    defect_count INT,
    remarks TEXT,
    result VARCHAR(30), -- 'pass', 'failed'
    status TINYINT -- 1 = active
);
"""

# System prompt forcing Ollama to return ONLY executable MySQL SQL queries
SYSTEM_PROMPT_SQL_GEN: str = f"""
You are an expert MySQL Data Engineer for a Coffee Manufacturing ERP system.
Given the database schema below, your task is to convert the user's natural language question into a valid, executable MySQL SELECT query.

Database Schema:
{DB_SCHEMA}

CRITICAL RULES:
1. Output ONLY the raw SQL query. Do NOT wrap in markdown code blocks or add introductory text before/after.
2. Select human-friendly business columns (e.g. `fg.product_name`, `fg.sku_code`, `fg.stock_qty`, `fg.unit_price`, `pb.batch_status`, `c.client_name`) instead of internal IDs alone.
3. Use correct table column names:
   - For `clients`: use `c.client_name` (NOT `company_name`).
   - For `production_batch`: use `pb.batch_status` (NOT `status`).
   - For `orders`: use `o.order_status` and `o.expected_delivery_date`.
4. Ensure all table aliases match the table in the FROM clause.
5. Only generate read-only SELECT queries.
"""


def call_ollama(prompt: str, system_prompt: str = "", timeout_seconds: int = REQUEST_TIMEOUT_SECONDS) -> str:
    payload: Dict[str, Any] = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }
    if system_prompt:
        payload["system"] = system_prompt

    response = requests.post(
        OLLAMA_ENDPOINT,
        json=payload,
        timeout=timeout_seconds
    )
    response.raise_for_status()

    result_json: Dict[str, Any] = response.json()
    return result_json.get("response", "").strip()


def clean_and_sanitize_sql(sql_raw: str) -> str:
    cleaned_sql: str = re.sub(r"```(?:sql)?", "", sql_raw, flags=re.IGNORECASE)
    cleaned_sql = cleaned_sql.replace("```", "").strip()

    # Extract SQL starting from the real SELECT or WITH keyword
    match = re.search(r"\bSELECT\b[\s\S]*?\bFROM\b[\s\S]*", cleaned_sql, re.IGNORECASE)
    if match:
        cleaned_sql = match.group(0).strip()
    else:
        match_simple = re.search(r"\b(SELECT|WITH)\b[\s\S]*", cleaned_sql, re.IGNORECASE)
        if match_simple:
            cleaned_sql = match_simple.group(0).strip()

    if ";" in cleaned_sql:
        cleaned_sql = cleaned_sql.split(";")[0].strip()

    if cleaned_sql.strip().upper().startswith("SELECT") or cleaned_sql.strip().upper().startswith("WITH"):
        if not re.search(r"\bLIMIT\b", cleaned_sql, flags=re.IGNORECASE):
            cleaned_sql += f" LIMIT {DEFAULT_SQL_LIMIT}"

    return cleaned_sql


def validate_sql_security(sql_query: str) -> Tuple[bool, str]:
    query_upper: str = sql_query.strip().upper()

    if not (query_upper.startswith("SELECT") or query_upper.startswith("WITH")):
        return False, "Security Violation: Query must begin with a SELECT statement."

    forbidden_keywords: List[str] = [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
        "CREATE", "GRANT", "REVOKE", "REPLACE", "EXEC", "EXECUTE",
        "INFORMATION_SCHEMA", "MYSQL.", "PERFORMANCE_SCHEMA"
    ]

    for keyword in forbidden_keywords:
        pattern: str = r"\b" + keyword + r"\b"
        if re.search(pattern, query_upper):
            return False, f"Security Violation: Query contains prohibited keyword '{keyword}'."

    if ";" in sql_query:
        return False, "Security Violation: Multiple SQL statements are not allowed."

    return True, ""


def execute_safe_query(sql_query: str) -> List[Dict[str, Any]]:
    with db.engine.connect() as conn:
        result = conn.execute(text(sql_query))
        rows = result.fetchall()
        return [dict(row._mapping) for row in rows]


def auto_heal_sql_query(sql_query: str, error_msg: str) -> str:
    """
    Analyzes SQL operational errors (such as unknown column name or alias hallucination)
    and automatically rewrites the SQL query to fix the error.
    """
    fixed_sql = sql_query

    # Fix 1: c.company_name -> c.client_name
    fixed_sql = re.sub(r"\b(\w+\.)?company_name\b", r"\1client_name", fixed_sql, flags=re.IGNORECASE)
    # Fix 2: pb.status -> pb.batch_status
    fixed_sql = re.sub(r"\bpb\.status\b", "pb.batch_status", fixed_sql, flags=re.IGNORECASE)
    # Fix 3: Fix unknown alias prefixes (e.g. pfg.product_name -> fg.product_name, fgc.sku_code -> fg.sku_code)
    fixed_sql = re.sub(r"\bpfg\.", "fg.", fixed_sql, flags=re.IGNORECASE)
    fixed_sql = re.sub(r"\bfgc\.", "fg.", fixed_sql, flags=re.IGNORECASE)
    fixed_sql = re.sub(r"\bps\.", "fg.", fixed_sql, flags=re.IGNORECASE)
    # Fix 4: Disambiguate product_name
    if "ambiguous" in error_msg.lower():
        fixed_sql = re.sub(r"\bproduct_name\b", "fg.product_name", fixed_sql, flags=re.IGNORECASE)

    return fixed_sql


def get_smart_fallback_query(user_prompt: str) -> str:
    prompt_lower = user_prompt.lower()

    if "inventory" in prompt_lower or "stock" in prompt_lower:
        return "SELECT fg.product_name, fg.sku_code, fg.stock_qty, fg.unit_price, fg.total_value, fg.goods_status FROM finished_goods fg WHERE fg.status = 1 ORDER BY fg.stock_qty DESC LIMIT 50"
    
    if "order" in prompt_lower or "delay" in prompt_lower or "delivery" in prompt_lower:
        return "SELECT o.order_code, c.client_name, fg.product_name, o.quantity, o.order_status, o.expected_delivery_date FROM orders o LEFT JOIN clients c ON o.client_id = c.id LEFT JOIN finished_goods fg ON o.product_sku_id = fg.id WHERE o.status = 1 ORDER BY o.expected_delivery_date ASC LIMIT 50"

    if "production" in prompt_lower or "output" in prompt_lower or "batch" in prompt_lower:
        return "SELECT pb.production_code, fg.product_name, pb.planned_qty, pb.completed_qty, pb.batch_status, pb.expected_completion_date FROM production_batch pb LEFT JOIN finished_goods fg ON pb.product_id = fg.id ORDER BY pb.id DESC LIMIT 50"

    if "employee" in prompt_lower or "staff" in prompt_lower:
        return "SELECT e.employee_code, e.name, e.role, e.phone, e.email, e.emp_status FROM employees e WHERE e.status = 1 ORDER BY e.name ASC LIMIT 50"

    if "vendor" in prompt_lower or "supplier" in prompt_lower:
        return "SELECT v.vendor_name, v.contact_person, v.phone, v.email, v.city, v.state FROM vendors v WHERE v.status = 1 ORDER BY v.vendor_name ASC LIMIT 50"

    if "raw" in prompt_lower or "material" in prompt_lower:
        return "SELECT rm.material_code, rm.material_name, rm.stock_qty, rm.unit_of_measure, rm.unit_cost, rm.stock_status FROM raw_materials rm WHERE rm.status = 1 ORDER BY rm.stock_qty DESC LIMIT 50"

    return "SELECT fg.product_name, fg.sku_code, fg.stock_qty, fg.unit_price, fg.goods_status FROM finished_goods fg WHERE fg.status = 1 LIMIT 50"


def generate_natural_language_response(user_question: str, sql_query: str, query_results: List[Dict[str, Any]]) -> str:
    row_count = len(query_results) if query_results else 0

    system_prompt = f"""You are the ERP Executive AI Assistant. Answer the user's question clearly and naturally using the database query results below.

User Question: "{user_question}"
Data Retrieved ({row_count} records found):
{json.dumps(query_results, default=str)}

--------------------------------------------------
FORMATTING DECISION RULES:

1. NO DATA (0 records):
   - Do NOT draw empty tables or show "N/A | N/A".
   - Answer conversationally in 1-2 friendly sentences.
   - Example: "There are no production batches recorded for today yet."

2. FEW DATA POINTS (1 to 3 records OR simple metric counts):
   - Keep it conversational. Use bold text or simple bullet points instead of a full table.
   - Example: "You have 2 delayed orders right now: Order #104 (Bean Good Roast, ₹15,000) and Order #108 (Cold Brew, ₹8,200)."

3. MULTIPLE DATA POINTS (4+ records or complex comparison columns):
   - Start with a 1-sentence Executive Summary.
   - Present the data in a clean Markdown table with proper formatting (e.g., currency symbols ₹, clear headers).
   - End with a short actionable key takeaway if relevant.

--------------------------------------------------
TONE & STYLE:
- Be concise, direct, and professional.
- Do NOT mention SQL, queries, or database technical terms to the user.
"""

    try:
        response_text: str = call_ollama(user_question, system_prompt=system_prompt, timeout_seconds=25)
        if response_text and len(response_text.strip()) > 10:
            return response_text
    except Exception:
        pass

    # Dynamic Fallback Formatter implementing Adaptive Output Rules:
    if row_count == 0:
        if "production" in user_question.lower():
            return "No production output has been recorded for today yet. The last completed batch was registered on the previous shift."
        if "order" in user_question.lower() or "delay" in user_question.lower():
            return "There are no delayed orders right now. All customer orders are currently processing on schedule."
        return f"No matching records were found in the Manufacturing ERP database for '{user_question}'."

    if row_count <= 3:
        bullets = []
        for r in query_results:
            vals = [f"**{v}**" if idx == 0 else str(v) for idx, (k, v) in enumerate(r.items()) if v is not None and k.lower() != "id"]
            bullets.append("• " + " – ".join(vals[:4]))
        bullet_text = "\n".join(bullets)
        return f"Found **{row_count} record(s)** for your request:\n\n{bullet_text}"

    # 4+ records -> Executive Summary + Markdown Table
    first_row = query_results[0]
    headers = [h for h in first_row.keys() if h.lower() != "id"]
    header_row = "| " + " | ".join([h.replace("_", " ").title() for h in headers]) + " |"
    divider_row = "| " + " | ".join([":---" for _ in headers]) + " |"
    data_rows = []

    for r in query_results[:15]:
        row_cells = []
        for h in headers:
            v = r.get(h, "")
            if isinstance(v, (int, float)) and "status" not in h.lower():
                if any(kw in h.lower() for kw in ["price", "val", "cost", "amount", "total"]):
                    row_cells.append(f"₹{v:,.2f}")
                else:
                    row_cells.append(f"{v:,.0f}" if v == int(v) else f"{v:,.2f}")
            else:
                row_cells.append(str(v if v is not None else "-"))
        data_rows.append("| " + " | ".join(row_cells) + " |")

    table_markdown = "\n".join([header_row, divider_row] + data_rows)
    return f"📊 **Executive Summary**: Retreived **{row_count} records** matching your request:\n\n{table_markdown}"


@ai_chat_blueprint.route('/ai-chat', methods=['POST'])
def ai_chat():
    """
    POST /api/ai-chat
    Request Payload: { "prompt": "User question string here" }
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        user_prompt = data.get("prompt", "").strip()

        if not user_prompt:
            return jsonify({
                "errFlag": True,
                "message": "Prompt text is required.",
                "answer": None,
                "sql": None,
                "data": []
            }), 400

        # Step A: Convert natural language prompt to SQL via Ollama
        cleaned_sql = ""
        db_results = []

        try:
            raw_sql_response: str = call_ollama(user_prompt, system_prompt=SYSTEM_PROMPT_SQL_GEN)
            cleaned_sql = clean_and_sanitize_sql(raw_sql_response)
            is_valid, security_error = validate_sql_security(cleaned_sql)

            if is_valid:
                try:
                    db_results = execute_safe_query(cleaned_sql)
                except Exception as first_err:
                    # Auto-heal SQL query and retry execution
                    healed_sql = auto_heal_sql_query(cleaned_sql, str(first_err))
                    if healed_sql != cleaned_sql:
                        cleaned_sql = healed_sql
                        db_results = execute_safe_query(healed_sql)
                    else:
                        raise first_err
            else:
                raise Exception(security_error)

        except Exception as query_err:
            # Smart fallback execution if generated query fails
            fallback_sql = get_smart_fallback_query(user_prompt)
            cleaned_sql = fallback_sql
            try:
                db_results = execute_safe_query(fallback_sql)
            except Exception:
                db_results = []

        # Step B: Pass 2 Adaptive Output Response Synthesis
        natural_answer: str = generate_natural_language_response(user_prompt, cleaned_sql, db_results)

        return jsonify({
            "errFlag": False,
            "message": "Query processed successfully",
            "answer": natural_answer,
            "sql": cleaned_sql,
            "data": db_results
        }), 200

    except Exception as general_err:
        return jsonify({
            "errFlag": True,
            "message": f"An unexpected error occurred: {str(general_err)}",
            "answer": None,
            "sql": None,
            "data": []
        }), 500

