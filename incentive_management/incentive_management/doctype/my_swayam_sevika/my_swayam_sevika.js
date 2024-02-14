// Copyright (c) 2024, Talibsheikh16@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on("My Swayam Sevika", {
  onload: function (frm) {
    if (frm.is_new()) {
      // Setting Employee ID for new forms
      const user = frappe.session.user;
      const eid = user.match(/\d+/)[0];
      frm.set_value("employee_id", eid);
      frm.set_value("status", ""); // Set status to blank for new forms
    }
  },
  before_save: function (frm) {
    // If the status is blank, set it to "Draft" before saving
    if (!frm.doc.status) {
      frm.set_value("status", "Draft");
    }

    // Check if ss_code is entered
    if (!frm.doc.ss_code) {
      frappe.msgprint("Please enter the SS Code.");
      frappe.validated = false; // Prevent saving
      return;
    }

    // Check if ss_code exists in Swayam Sevika Data doctype
    frappe.call({
      method:
        "incentive_management.incentive_management.doctype.my_swayam_sevika.my_swayam_sevika.fetch_sevika_data",
      args: {
        ss_code: frm.doc.ss_code,
      },
      callback: function (r) {
        if (r.message) {
          // If ss_code exists, populate the form fields
          frm.doc.full_name = r.message.full_name;
          frm.doc.date_of_birth = r.message.date_of_birth;
          frm.doc.aadhar_number = r.message.aadhar_number;
          frm.doc.pan_number = r.message.pan_number;
          frm.doc.gender = r.message.gender;
          frm.doc.phone = r.message.phone;
          frm.doc.highest_education = r.message.highest_education;
          frm.doc.present_address = r.message.present_address;
          frm.doc.city = r.message.city;

          // Refresh form fields
          frm.refresh_fields();
        } else {
          // If ss_code doesn't exist, prevent saving
          frappe.msgprint("Swayam Sevika with this code does not exist.");
          frappe.validated = false; // Prevent saving
        }
      },
    });
  },
  refresh: function (frm) {
    // Check if the status is "Draft" and the user has the appropriate role
    if (frappe.user.has_role("BDO & BDE") && frm.doc.status === "Draft") {
      // Add custom button for "Send for Approval"
      frm
        .add_custom_button(__("Send for Approval"), function () {
          frappe.confirm(
            "Are you sure you want to Submit Swayam Sevika Data?",
            () => {
              // action to perform if Yes is selected
              frm.set_value("status", "Pending From MIS");
              frm.refresh_field("status");
              frm.save();
            },
            () => {
              // action to perform if No is selected
            }
          );
        })
        .css({
          "background-color": "#28a745", // Set green color
          color: "#ffffff", // Set font color to white
        });

      // Add delete button
      frm
        .add_custom_button(__("Delete"), function () {
          // Check if the user has the appropriate role and the status is "Draft"
          if (frappe.user.has_role("BDO & BDE") && frm.doc.status === "Draft") {
            // Show confirmation dialog before deletion
            frappe.confirm(
              __("Are you sure you want to delete this document?"),
              function () {
                // Delete the document
                frappe.call({
                  method: "frappe.client.delete",
                  args: {
                    doctype: frm.doctype,
                    name: frm.docname,
                  },
                  callback: function (r) {
                    if (r.message) {
                      // Redirect to specified route after successful deletion
                      window.location.href = "/app/my-swayam-sevika";
                    }
                  },
                });
              }
            );
          } else {
            frappe.msgprint(__("You are not allowed to delete this document."));
          }
        })
        .addClass("btn-danger");

      // Hide menu button
      frm.page.menu_btn_group.toggle(false);
    }

    // Disable save button if status is "Pending From MIS" and user has "BDO & BDE" role
    if (
      frm.doc.status === "Pending From MIS" &&
      frappe.user.has_role("BDO & BDE")
    ) {
      frm.disable_save();
    }
  },
});
