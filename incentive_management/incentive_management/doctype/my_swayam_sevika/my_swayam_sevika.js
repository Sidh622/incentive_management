// Copyright (c) 2024, Talibsheikh16@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on("My Swayam Sevika", {
  before_save: function (frm) {
    // If the status is blank, set it to "Draft" before saving
    if (!frm.doc.status) {
      frm.set_value("status", "Draft");
      frm.refresh_field("status");
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
          //frm.doc.highest_education = r.message.highest_education;
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
      console.log("neww");
      // When form is new
      // Setting Employee ID
      const user = frappe.session.user;
      const eid = user.match(/\d+/)[0];
      frm.set_value("employee_id", eid);
      frm.refresh_field("employee_id");
      frm.set_value("status", "");
      frm.refresh_field("status");
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
            frm.refresh_field("emp_phone"); // Corrected field name

            frm.set_value("region", employeeData.region);
            frm.refresh_field("region");

            frm.set_value("division", employeeData.division);
            frm.refresh_field("division");

            frm.set_value("district", employeeData.district);
            frm.refresh_field("district");

            frm.set_value("branch", employeeData.branch);
            frm.refresh_field("branch");

            frm.set_value("department", employeeData.department);
            frm.refresh_field("department");
          }
        },
      });
    }

    // Add custom buttons based on user roles and document status
    if (!frm.is_new()) {
      // When form is not new
      // Disable save button if status is "Approved" or "Rejected" or "Pending From MIS" and user has "MIS User" role
      if (
        //frm.doc.status === "Approved" ||
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

  // Define the find button function
  find: function (frm) {
    // Fetch ss_code from the form
    var ssCode = frm.doc.ss_code;

    // Check if ss_code is entered
    if (!ssCode) {
      frappe.msgprint("Please enter the SS Code.");
      return;
    }

    // Check if ss_code exists in Swayam Sevika Data doctype
    frappe.call({
      method:
        "incentive_management.incentive_management.doctype.my_swayam_sevika.my_swayam_sevika.fetch_sevika_data",
      args: {
        ss_code: ssCode,
      },
      callback: function (r) {
        if (r.message) {
          console.log(r.message);
          // If ss_code exists, populate the form fields
          var sevikaData = r.message;

          frm.set_value("full_name", sevikaData.full_name);
          frm.set_value("date_of_birth", sevikaData.date_of_birth);
          frm.set_value("aadhar_number", sevikaData.aadhar_number);
          frm.set_value("pan_number", sevikaData.pan_number);
          frm.set_value("gender", sevikaData.gender);
          frm.set_value("phone", sevikaData.phone);
          //frm.set_value("highest_education", sevikaData.highest_education);
          frm.set_value("present_address", sevikaData.present_address);
          frm.set_value("city", sevikaData.city);

          // Refresh form fields
          frm.refresh_fields();
        } else {
          // If ss_code doesn't exist, show a message
          frappe.msgprint("Swayam Sevika with this code does not exist.");
        }
      },
    });
  },

  admin_save: function (frm) {
    // Trigger save operation
    frm.save();
  },
});
