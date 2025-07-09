# Attendance Analyzer

A modern, comprehensive student attendance management system built with React, featuring dual attendance interfaces, analytics, and Excel integration.

## 🚀 Features

### 👨‍🏫 Student Management
- **Individual Student Addition**: Add students with name, roll number, year, division, email, and phone
- **Student Directory**: Organized view by year and division
- **Validation**: Ensures required fields and unique roll numbers

### 📋 Dual Attendance Interfaces

#### ✅ Checkbox Attendance
- Classic table/grid interface with checkboxes
- Bulk marking options (All Present/All Absent)
- Date selection for attendance records
- Real-time statistics and progress tracking

#### 🎴 Swipe Card Attendance
- Engaging card-based interface with student photos
- Swipe gestures: Right = Present, Left = Absent
- Smooth animations and transitions using Framer Motion
- Manual control buttons as alternative to swiping
- Progress tracking and session management

### 📊 Analytics & Reports
- **Comprehensive Charts**: Pie charts, bar charts, and line graphs using Recharts
- **Advanced Filtering**: By date range, year, division, and individual students
- **Key Metrics**: Attendance rates, present/absent counts, trends over time
- **Individual Performance**: Student-wise attendance statistics
- **Visual Insights**: Attendance distribution and patterns

### 📁 Excel Import/Export
- **Batch Import**: CSV file import for bulk student addition
- **Template Download**: Pre-formatted CSV template for easy data entry
- **Filtered Export**: Export attendance data with date, year, and division filters
- **Multiple Formats**: Student data and attendance records export
- **Audit Trail**: Timestamps included in attendance exports

## 🛠️ Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **File Handling**: Browser File API for CSV import/export

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start
```bash
# Clone or extract the project
cd attendance-analyzer

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📖 Usage Guide

### Adding Students

1. **Individual Addition**:
   - Navigate to "Students" tab
   - Fill in required fields: Name, Roll Number, Year, Division
   - Optionally add Email and Phone
   - Click "Add Student"

2. **Batch Import**:
   - Go to "Excel" tab
   - Download the CSV template
   - Fill in student data following the format
   - Upload the CSV file

### Recording Attendance

#### Checkbox Method:
1. Go to "Checkbox" tab
2. Select the date
3. Check/uncheck boxes for each student
4. Use "All Present" or "All Absent" for bulk marking
5. Click "Save Attendance"

#### Swipe Card Method:
1. Go to "Swipe Cards" tab
2. Select the date
3. Swipe student cards: Right = Present, Left = Absent
4. Or use manual "Mark Present"/"Mark Absent" buttons
5. Click "Save" when session is complete

### Viewing Analytics

1. Navigate to "Analytics" tab
2. Use filters to narrow down data:
   - Date Range (Today, Week, Month, Custom)
   - Year and Division
   - Individual Students
3. View charts and statistics
4. Check individual student performance table

### Exporting Data

1. Go to "Excel" tab
2. **Export Students**: Download all student information
3. **Export Attendance**: 
   - Set date range and filters
   - Download filtered attendance records
   - Includes timestamps for audit trail

## 📁 Project Structure

```
attendance-analyzer/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── StudentManagement.jsx
│   │   ├── CheckboxAttendance.jsx
│   │   ├── SwipeAttendance.jsx
│   │   ├── Analytics.jsx
│   │   └── ExcelManager.jsx
│   ├── App.jsx            # Main application component
│   ├── App.css            # Global styles
│   └── main.jsx           # Application entry point
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## 🎨 Key Components

### StudentManagement
- Student form with validation
- Student directory with search and filtering
- Statistics dashboard

### CheckboxAttendance
- Table-based attendance interface
- Bulk operations
- Date selection and filtering

### SwipeAttendance
- Card-based interface with animations
- Gesture recognition
- Session management

### Analytics
- Multiple chart types (Pie, Bar, Line)
- Advanced filtering system
- Performance metrics

### ExcelManager
- CSV import/export functionality
- Template generation
- Data validation

## 🔧 Customization

### Adding New Years
Edit the `years` array in components to add new academic years:
```javascript
const years = ['FirstYear', 'SecondYear', 'ThirdYear', 'FourthYear', 'FifthYear']
```

### Adding New Divisions
Edit the `divisions` array to add new divisions:
```javascript
const divisions = ['A', 'B', 'C', 'D', 'E']
```

### Styling
- Modify `tailwind.config.js` for theme customization
- Update component styles in individual `.jsx` files
- Global styles in `App.css`

## 📊 Data Format

### Student Data Structure
```javascript
{
  id: "unique_id",
  name: "Student Name",
  rollNo: "2024001",
  year: "FirstYear",
  division: "A",
  email: "student@example.com",
  phone: "1234567890"
}
```

### Attendance Record Structure
```javascript
{
  id: "unique_id",
  studentId: "student_id",
  studentName: "Student Name",
  rollNo: "2024001",
  year: "FirstYear",
  division: "A",
  date: "2024-01-15",
  status: "present", // or "absent"
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

## 🚀 Deployment Options

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Static Hosting
Deploy the `dist` folder to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section below
2. Review component documentation
3. Check browser console for errors

## 🔧 Troubleshooting

### Common Issues

**Students not appearing in attendance**:
- Ensure students are added before taking attendance
- Check that the correct date is selected

**Import not working**:
- Verify CSV format matches the template
- Check for duplicate roll numbers
- Ensure required columns are present

**Charts not displaying**:
- Verify attendance data exists
- Check date filters in Analytics
- Ensure browser supports modern JavaScript

**Export not downloading**:
- Check browser popup/download settings
- Verify data exists for selected filters
- Try different browsers

### Performance Tips

- Regularly export and archive old attendance data
- Limit date ranges in analytics for better performance
- Use bulk import for large student datasets

## 🎯 Future Enhancements

Potential features for future versions:
- Photo upload for student profiles
- Email notifications for attendance
- Mobile app version
- Advanced reporting features
- Integration with school management systems
- Biometric attendance integration

---

**Built with ❤️ using React, Tailwind CSS, and modern web technologies.**

