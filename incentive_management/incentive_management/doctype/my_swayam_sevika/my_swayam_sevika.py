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
            "present_address": sevika_data.present_address,
            "city": sevika_data.city,
            "branch_code":sevika_data.branch_code,
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

@frappe.whitelist()
def delete_records_by_owner(user_id,employee_id):
    # Fetch records owned by the user from the "My Swayam Sevika" doctype
    records = frappe.get_list(
        "My Swayam Sevika", 
        filters={"owner": user_id},
        fields=["ss_code", "full_name", "date_of_birth", "branch_code", 
                "present_address", "city", "phone", "aadhar_number", "pan_number"]
    )
    
    # Print fetched records for debugging
    print("Fetched Records:", records)
    
    # If no records exist, return True without making any API calls
    if not records:
        return True
    
    try:
        # Save the records data in another doctype (e.g., "Disabled Agent Data")
        for record in records:
            backup_record = frappe.new_doc("Disabled Agents SS Data")
            backup_record.update({
                "ss_code": record.get("ss_code"),
                "full_name": record.get("full_name"),
                "date_of_birth": record.get("date_of_birth"),
                "branch_code": record.get("branch_code"),
                "present_address": record.get("present_address"),
                "city": record.get("city"),
                "phone": record.get("phone"),
                "aadhar_number": record.get("aadhar_number"),
                "pan_number": record.get("pan_number"),
                "previous_bdobde_empid": employee_id

            })
            backup_record.insert()
            print("Inserted Backup Record:", backup_record.name)
        
        print("First Records inserted successfully.")
       
        # Delete records owned by the user
        frappe.db.sql("DELETE FROM `tabMy Swayam Sevika` WHERE owner = %s", user_id)
        frappe.db.commit()
        print("Second Records deleted successfully.")
        return True
    except Exception as e:
        # Print the actual error message for debugging
        print("Error deleting records:", e)
        frappe.log_error("Error deleting records: " + str(e))
        return False
