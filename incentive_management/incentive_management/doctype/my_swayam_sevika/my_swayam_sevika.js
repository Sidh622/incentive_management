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
      //frm.set_value("active", 1); // Set active to 1 for new forms
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
    // add custom button only if form is not new
    if (frm.is_new()) {
      // When form is new
      // Setting Employee ID
      const user = frappe.session.user;
      const eid = user.match(/\d+/)[0];
      frm.set_value("employee_id", eid);
      console.log("Employee ID :", frm.doc.employee_id);

      // Fetching Employee Data
      frm.call({
        method: "fetch_employee_data",
        args: {
          employee_id: frm.doc.employee_id,
        },
        callback: function (r) {
          if (!r.exc) {
            // Accessing response data
            const employeeData = r.message[0]; // Accessing the first element of the array
            console.log("Employee Data:", employeeData);

            // Set emp_full_name field with employee's name
            frm.set_value("emp_full_name", employeeData.employee_name);
            frm.refresh_field("emp_full_name");

            frm.set_value("designation", employeeData.designation);
            frm.refresh_field("designation");

            frm.set_value("emp_phone", employeeData.cell_number);
            frm.refresh_field("cell_number"); // Corrected field name

            frm.set_value("region", employeeData.region);
            frm.refresh_field("region");

            frm.set_value("division", employeeData.division);
            frm.refresh_field("division");

            frm.set_value("branch", employeeData.branch);
            frm.refresh_field("branch");

            frm.set_value("department", employeeData.department);
            frm.refresh_field("department");
          }
        },
      });
    } else {
      // When form is not new
      console.log("Document", frm.doc.name);
    }

    // Add custom buttons based on user roles and document status
    if (!frm.is_new()) {
      // When form is not new
      // Disable save button if status is "Approved" or "Rejected" or "Pending From MIS" and user has "MIS User" role
      if (
        frm.doc.status === "Approved" ||
        frm.doc.status === "Rejected" ||
        (frm.doc.status === "Pending From MIS" &&
          frappe.user.has_role("MIS User"))
      ) {
        frm.disable_save();
      }

      // Check if the user has the appropriate role and the status is "Draft"
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

      // Add custom buttons for "Approve" and "Reject" if status is "Pending From MIS" and user has "MIS User" role
      if (
        frm.doc.status === "Pending From MIS" &&
        frappe.user.has_role("MIS User")
      ) {
        frm
          .add_custom_button(__("Approve"), function () {
            frappe.confirm(
              "Are you sure you want to Approve - <b>" +
                frm.doc.full_name +
                "</b>?",
              () => {
                // action to perform if Yes is selected
                frm.set_value("status", "Approved");
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

        frm
          .add_custom_button(__("Reject"), function () {
            frappe.confirm(
              "Are you sure you want to Reject - <b>" +
                frm.doc.full_name +
                "</b>?",
              () => {
                // action to perform if Yes is selected
                frm.set_value("status", "Rejected");
                frm.set_value("active", 0); // Set active to 0 if rejected
                frm.refresh_field("status");
                frm.refresh_field("active");
                frm.save();
              },
              () => {
                // action to perform if No is selected
              }
            );
          })
          .css({
            "background-color": "#dc3545", // Set red color
            color: "#ffffff", // Set font color to white
          });
      }
    }
  },
});

// Adding the functionality for "Admin Save" field
frappe.ui.form.on("My Swayam Sevika", {
  admin_save: function (frm) {
    // Trigger save operation
    frm.save();
  },
});

// // Add delete button
// frm
//   .add_custom_button(__("Delete"), function () {
//     // Check if the user has the appropriate role and the status is "Draft"
//     if (
//       frappe.user.has_role("BDO & BDE") &&
//       frm.doc.docstatus === 0 // Assuming "Draft" status is represented by docstatus 0
//     ) {
//       // Show confirmation dialog before deletion
//       frappe.confirm(
//         __("Are you sure you want to delete this document?"),
//         function (confirmed) {
//           if (confirmed) {
//             // Delete the document
//             frappe.call({
//               method: "frappe.client.delete",
//               args: {
//                 doctype: frm.doc.doctype,
//                 name: frm.doc.name,
//                 with_similar: 0, // Delete only this specific document
//               },
//               callback: function (r) {
//                 if (!r.exc) {
//                   // Optional: Redirect to a new page after deletion
//                   frappe.set_route("List", frm.doc.doctype);
//                 }
//               },
//             });
//           }
//         }
//       );
//     } else {
//       frappe.msgprint(
//         __("You are not allowed to delete this document.")
//       );
//     }
//   })
//   .addClass("btn-danger");
