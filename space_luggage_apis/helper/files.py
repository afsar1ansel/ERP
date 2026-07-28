# helpers/files.py
import tempfile
import os
from flask import after_this_request, send_file

def send_workbook_response(workbook, filename, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"):
    """
    Save openpyxl Workbook -> temp file -> return send_file response.
    Cleans up temp file after response using after_this_request.
    """
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1])
    tmp_name = tmp.name
    tmp.close()  # will write using workbook.save()

    try:
        workbook.save(tmp_name)
    except Exception as e:
        try:
            os.unlink(tmp_name)
        except Exception:
            pass
        raise

    @after_this_request
    def _remove_temp_file(response):
        try:
            os.remove(tmp_name)
        except Exception:
            pass
        return response

    return send_file(
        tmp_name,
        as_attachment=True,
        download_name=filename,
        mimetype=mimetype,
        conditional=False
    )


def send_bytesio_response(buffer, filename, mimetype="application/octet-stream"):
    """
    Save BytesIO buffer to temp file and return as send_file.
    Use this when you already have bytes in memory.
    """
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1])
    tmp_name = tmp.name
    try:
        with open(tmp_name, "wb") as f:
            f.write(buffer.getvalue())
    except Exception:
        try:
            os.unlink(tmp_name)
        except Exception:
            pass
        raise

    @after_this_request
    def _remove_temp_file(response):
        try:
            os.remove(tmp_name)
        except Exception:
            pass
        return response

    return send_file(
        tmp_name,
        as_attachment=True,
        download_name=filename,
        mimetype=mimetype,
        conditional=False
    )
