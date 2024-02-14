# Copyright (c) 2024, Talibsheikh16@gmail.com and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

class MySwayamSevika(Document):
	pass

import frappe
from frappe import _

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
            "highest_education": sevika_data.highest_education,
            "present_address": sevika_data.present_address,
            "city": sevika_data.city
        }
    else:
        return {}

