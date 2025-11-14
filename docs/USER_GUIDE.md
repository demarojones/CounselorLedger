# School Counselor Ledger - User Guide

Welcome to the School Counselor Ledger! This guide will help you understand and use the key features of the application.

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard](#dashboard)
- [Managing Interactions](#managing-interactions)
- [Student Management](#student-management)
- [Contact Management](#contact-management)
- [Calendar View](#calendar-view)
- [Follow-Up Tracking](#follow-up-tracking)
- [Reports](#reports)
- [Admin Features](#admin-features)

---

## Getting Started

### Logging In

1. Navigate to the application URL
2. Enter your email address and password
3. Click "Sign In"

Your role (Admin or Counselor) determines which features you can access.

### First-Time Setup

If you're an administrator, you'll want to:
1. Set up interaction reason categories
2. Create counselor accounts
3. Import or create student records

---

## Dashboard

The dashboard provides an at-a-glance view of your counseling activities.

### Key Metrics

- **Total Interactions** - Number of interactions in the selected date range
- **Total Students** - Unique students you've worked with
- **Total Time Spent** - Cumulative time across all interactions

### Category Breakdown

A pie chart shows the distribution of interactions by reason category, helping you understand where you're spending your time.

### Recent Activity

View your 10 most recent interactions with quick access to details.

### Date Range Filter

Change the date range to view statistics for:
- Last 7 days
- Last 30 days (default)
- Last 90 days
- This year
- Custom date range

---

## Managing Interactions

Interactions are the core of the application, tracking every meeting or contact with students and external contacts.

### Creating an Interaction

1. Click "Add Interaction" from the dashboard or interactions page
2. Select interaction type: **Student** or **Contact**
3. Search and select the student or contact
4. Choose a **Reason Category** (e.g., Academic Support, Behavioral)
5. Optionally select a **Subcategory** for more detail
6. If you select "Custom" subcategory, enter a custom reason
7. Set the **Start Time** using the date/time picker
8. Enter **Duration** in minutes
9. The **End Time** is calculated automatically
10. Add any **Notes** about the interaction
11. Check **"Needs follow-up"** if required
    - Set a follow-up date
    - Add follow-up notes
12. Click **"Save Interaction"**

### Viewing Interactions

The interactions list shows:
- Student/Contact name
- Category and subcategory
- Date and time
- Duration
- Counselor name (admins see all counselors)

**Filtering:**
- By date range
- By category
- By student or contact
- By follow-up status

**Sorting:**
- Click column headers to sort
- Default: Most recent first

### Editing an Interaction

1. Click the "Edit" button on an interaction
2. Modify any fields
3. Click "Update Interaction"

### Deleting an Interaction

1. Click the "Delete" button on an interaction
2. Confirm the deletion
3. The interaction is permanently removed

---

## Student Management

### Viewing Students

The students page displays all students in your school with:
- Student ID
- Name
- Grade level
- Number of interactions
- Total time spent
- Follow-up needed indicator

### Student Profile

Click on a student to view their profile:
- Basic information (ID, name, grade, contact info)
- Interaction statistics
- Follow-up status
- Complete interaction history

### Adding an Interaction from Student Profile

Click "Add Interaction" on a student profile to create a new interaction with the student field pre-filled.

### Searching for Students

Use the search bar to find students by:
- Name
- Student ID
- Grade level

---

## Contact Management

Contacts are external people you interact with (parents, teachers, administrators, etc.).

### Viewing Contacts

The contacts page shows:
- Name
- Relationship (Parent, Teacher, Administrator, etc.)
- Organization
- Email and phone
- Number of interactions

### Creating a Contact

1. Click "Add Contact"
2. Enter first and last name
3. Select relationship type
4. Add email, phone, and organization (optional)
5. Add notes (optional)
6. Click "Create Contact"

### Editing a Contact

1. Click "Edit" on a contact
2. Update information
3. Click "Update Contact"

### Contact Detail View

Click "View" on a contact to see:
- Full contact information
- Interaction history
- Quick "Add Interaction" button

---

## Calendar View

The calendar provides a visual representation of your interactions.

### Viewing the Calendar

- **Month View** - See all interactions for the month
- **Week View** - Detailed week schedule
- **Day View** - Hour-by-hour breakdown

### Color Coding

Interactions are color-coded by category for easy identification.

### Creating Interactions from Calendar

1. Click on a date/time slot
2. The interaction form opens with the date/time pre-filled
3. Complete the form and save

### Viewing Interaction Details

Click on any calendar event to view full interaction details.

### Rescheduling Interactions

1. Drag and drop an interaction to a new time slot
2. Confirm the change
3. The interaction is updated

**Note:** Drag-and-drop is disabled on mobile devices. Use the edit function instead.

---

## Follow-Up Tracking

Follow-ups help you remember to check back with students.

### Creating a Follow-Up

When creating or editing an interaction:
1. Check "This interaction needs follow-up"
2. Set a follow-up date
3. Add follow-up notes explaining what needs to be done

### Viewing Pending Follow-Ups

Navigate to the Follow-Ups page to see:
- All pending follow-ups
- Overdue follow-ups (highlighted in red)
- Follow-up date and notes
- Related student information

### Completing a Follow-Up

1. Click "Mark Complete" on a follow-up
2. Add completion notes (optional)
3. The follow-up is marked complete and removed from pending list

### Follow-Up Indicators

- Student profiles show a badge if follow-up is needed
- Student list shows follow-up count
- Dashboard highlights overdue follow-ups

---

## Reports

Reports help you analyze your counseling activities and demonstrate impact.

### Available Reports

1. **Student Volume Report**
   - Total unique students seen
   - Breakdown by grade level
   - Trend over time

2. **Interaction Frequency Report**
   - Students seen most often
   - Interaction counts per student
   - Total time spent with each student

3. **Grade Level Distribution**
   - Interactions by grade level
   - Bar chart visualization
   - Percentage breakdown

4. **Time Allocation Report**
   - Time spent by category
   - Time spent by grade level
   - Time spent with individual students (top 20)

### Filtering Reports

All reports can be filtered by:
- **Date Range** - Custom start and end dates
- **Grade Level** - Specific grades or all grades
- **Category** - Specific interaction types
- **Counselor** - (Admin only) View specific counselor's data

### Exporting Reports

1. Generate the report with desired filters
2. Click "Export to CSV" for spreadsheet data
3. Click "Export to PDF" for formatted document with charts

---

## Admin Features

Administrators have additional capabilities for managing the system.

### User Management

**Creating Users:**
1. Navigate to Admin → User Management
2. Click "Add User"
3. Enter email, first name, last name
4. Select role (Admin or Counselor)
5. Click "Create User"
6. User receives invitation email

**Editing Users:**
1. Click "Edit" on a user
2. Update information
3. Click "Update User"

**Deactivating Users:**
1. Click "Deactivate" on a user
2. Confirm deactivation
3. User can no longer log in

### Reason Category Management

**Creating Categories:**
1. Navigate to Admin → Reason Management
2. Click "Add Category"
3. Enter category name
4. Choose a color for calendar display
5. Set sort order
6. Click "Create Category"

**Adding Subcategories:**
1. Click "Add Subcategory" under a category
2. Enter subcategory name
3. Set sort order
4. Click "Create Subcategory"

**Editing/Deleting:**
- Click "Edit" or "Delete" on any category or subcategory
- Changes apply immediately

**Reordering:**
- Drag and drop categories/subcategories to reorder
- Order affects dropdown display throughout the app

### System-Wide Reports

Admins can view reports across all counselors:
1. Generate any report
2. Use the "Counselor" filter to view specific counselor data
3. Leave filter empty to see all counselors combined

---

## Tips and Best Practices

### Recording Interactions

- **Be timely** - Record interactions soon after they occur
- **Be detailed** - Add notes that will be helpful later
- **Use categories consistently** - Helps with reporting
- **Set follow-ups** - Don't rely on memory alone

### Using the Calendar

- **Color code** - Assign distinct colors to categories
- **Block time** - Schedule interactions in advance
- **Review weekly** - Check upcoming week every Monday

### Managing Follow-Ups

- **Check daily** - Review pending follow-ups each morning
- **Set realistic dates** - Don't overcommit
- **Add context** - Detailed follow-up notes save time later
- **Complete promptly** - Mark follow-ups complete when done

### Generating Reports

- **Regular reviews** - Generate monthly reports
- **Compare periods** - Look at trends over time
- **Share insights** - Use reports in meetings and presentations
- **Export for records** - Keep PDF copies for documentation

### Data Quality

- **Accurate times** - Record actual start times and durations
- **Complete profiles** - Keep student and contact info up to date
- **Consistent categories** - Use the same categories for similar interactions
- **Regular cleanup** - Archive or remove outdated contacts

---

## Keyboard Shortcuts

### Global

- `Ctrl/Cmd + K` - Quick search
- `Esc` - Close modal/dropdown

### SearchableDropdown

- `Arrow Down` - Move to next option
- `Arrow Up` - Move to previous option
- `Enter` - Select highlighted option
- `Escape` - Close dropdown
- `Tab` - Close dropdown and move to next field

### Calendar

- `T` - Go to today
- `Left/Right Arrow` - Previous/next period
- `Space` - Create new interaction

---

## Troubleshooting

### Can't find a student

- Check spelling
- Try searching by student ID
- Verify student exists in the system
- Contact admin if student needs to be added

### Interaction not saving

- Check all required fields are filled
- Verify date/time is valid
- Check duration is a positive number
- Ensure you have internet connection

### Calendar not loading

- Refresh the page
- Check date range isn't too large
- Clear browser cache
- Contact support if issue persists

### Reports showing no data

- Verify date range includes interactions
- Check filters aren't too restrictive
- Ensure you have interactions in the system
- Admins: Check counselor filter

---

## Getting Help

### In-App Help

- Hover over field labels for tooltips
- Look for "?" icons for contextual help
- Check error messages for specific guidance

### Contact Support

If you encounter issues:
1. Note what you were trying to do
2. Take a screenshot if possible
3. Contact your system administrator
4. Provide your user email and description of the issue

---

## Mobile Usage

The application is fully responsive and works on mobile devices.

### Mobile-Specific Features

- **Hamburger menu** - Access navigation
- **Full-screen modals** - Forms take full screen
- **Touch-friendly** - Large tap targets
- **Simplified tables** - Horizontal scroll for tables

### Mobile Limitations

- **No drag-and-drop** - Use edit function to reschedule
- **Smaller charts** - Some visualizations simplified
- **Keyboard** - On-screen keyboard may cover fields

### Mobile Tips

- **Landscape mode** - Better for tables and calendar
- **Zoom** - Pinch to zoom on charts
- **Swipe** - Swipe to scroll tables horizontally

---

## Privacy and Security

### Data Protection

- All data is encrypted in transit and at rest
- Multi-tenant isolation ensures data separation
- Regular backups protect against data loss

### Access Control

- Role-based permissions (Admin vs Counselor)
- Counselors only see their own interactions
- Admins see all data for their school

### Session Management

- Sessions expire after inactivity
- Automatic logout for security
- Re-login required after expiration

### Best Practices

- **Strong passwords** - Use unique, complex passwords
- **Log out** - Always log out on shared computers
- **Don't share accounts** - Each user should have their own login
- **Report issues** - Report suspicious activity immediately

---

## Frequently Asked Questions

**Q: Can I delete an interaction?**
A: Yes, click the delete button on any interaction. This is permanent and cannot be undone.

**Q: How do I change my password?**
A: Contact your administrator to reset your password.

**Q: Can I see other counselors' interactions?**
A: Only if you're an administrator. Counselors only see their own data.

**Q: What happens to interactions if I delete a student?**
A: Interactions are preserved but the student reference is removed. It's better to mark students as inactive.

**Q: Can I export all my data?**
A: Yes, use the reports feature to export data in CSV or PDF format.

**Q: How far back does data go?**
A: All historical data is retained. Use date filters to view specific time periods.

**Q: Can I bulk import students?**
A: Contact your administrator about bulk import options.

**Q: What browsers are supported?**
A: Modern versions of Chrome, Firefox, Safari, and Edge are fully supported.

---

## Glossary

- **Interaction** - A meeting or contact with a student or external contact
- **Follow-up** - A reminder to check back with a student
- **Category** - High-level classification of interaction reason
- **Subcategory** - More specific classification under a category
- **Contact** - External person (parent, teacher, etc.)
- **Tenant** - Your school's isolated data environment
- **RLS** - Row Level Security, ensures data isolation
- **Admin** - User with full system access
- **Counselor** - User who records interactions

---

## Version History

### Version 1.0 (Current)
- Initial release
- Core interaction tracking
- Student and contact management
- Calendar view
- Follow-up tracking
- Reporting suite
- Admin features

---

For additional support or feature requests, please contact your system administrator.
