# Copyright (c) 2024, Talibsheikh16@gmail.com and contributors
# For license information, please see license.txt


import frappe
from frappe import _
from frappe.model.document import Document


class MySwayamSevika(Document):
	pass


@frappe.whitelist()
def fetch_sevika_data(ss_code):
    sevika_data = frappe.get_doc("Swayam Sevika Data", {"ss_code": ss_code})
    if sevika_data:
        return {
            "full_name": sevika_data.full_name,
            "date_of_birth": sevika_data.date_of_birth,
            "aadhar_number": sevika_data.aadhar_number,
            "pan_number": sevika_data.pan_number,
            "gender": sevika_data.gender,
            "phone": sevika_data.phone,
         #   "highest_education": sevika_data.highest_education,
            "present_address": sevika_data.present_address,
            "city": sevika_data.city
        }
    else:
        return {}
    
@frappe.whitelist()
def fetch_employee_data(employee_id):
    # Use parameterized query to prevent SQL injection
    sql_query = f"""
        SELECT employee_name, designation, branch, region, district, department, division, cell_number
        FROM `tabEmployee`
        WHERE employee_id=%s
    """
    # Execute the query with the provided employee_id
    result = frappe.db.sql(sql_query, (employee_id,), as_dict=True)
    
    return result

@frappe.whitelist()
def get_owner_full_name(owner):
    # Fetch the full name and employee ID of the user with the provided ID
    full_name = frappe.get_value("User", owner, "full_name")
    emp_id = frappe.get_value("User", owner, "employee_id")
    
    if full_name:
        return {"full_name": full_name, "employee_id": emp_id}
    else:
        frappe.throw(_("Full name not found for user ID: {0}").format(owner))
