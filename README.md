# Finance Tracker - Photography Studio Management

A comprehensive finance tracking and partner management web application for photography studios in India.

## Features

### 🏠 Dashboard
- Last month's revenue, expenses, and profit overview
- Quick navigation to all modules
- Real-time financial metrics in INR

### 📝 Transaction Management
- **Record Sales**: Track photography shoots with detailed information
  - Shoot types: Pre-Wedding, Baby, Half-Saree, Maternity, Post-Wedding, Model, Family
  - Track time, amount, payment mode, cameraman, customer details
- **Record Expenses**: Manage various expense categories
  - 27+ expense categories (Salary, Equipment, Props, etc.)
  - Track payer, payment mode, and descriptions
- **Record Investments**: Track partner capital injections
  - Automatic prompt to update partner shares

### 📊 Transaction History
- View all sales with detailed information
- Browse expense history
- Track investment records
- Sortable and filterable views

### 📈 Reports
- Monthly financial breakdown
- Revenue, expenses, and profit calculations
- Partner profit distribution based on shareholding
- Calendar month-based reporting (1st to last day)

### 👥 Partner Management
- Manage 5 partners (expandable to 6-7)
  - Silar (75%)
  - Om (13.41%)
  - Anurag (6.09%)
  - RK (3.65%)
  - Vijay (1.82%)
- Edit and update partner share percentages
- Automatic validation (total must equal 100%)

## Tech Stack

- **Frontend**: React 18 with React Router, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: Emergent Google Social Login
- **Deployment**: Supervisor process manager

## Setup

### Prerequisites
- Python 3.10+
- Node.js 16+
- MongoDB
- Yarn package manager

### Installation

1. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
```

2. **Frontend Setup**
```bash
cd frontend
yarn install
```

3. **Environment Variables**

Backend (.env):
```
MONGO_URL=mongodb://localhost:27017/
DATABASE_NAME=finance_tracker
SECRET_KEY=your-secret-key
```

Frontend (.env):
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Running the Application

The application is configured to run with Supervisor:

```bash
sudo supervisorctl restart all
sudo supervisorctl status
```

- Backend runs on: http://localhost:8001
- Frontend runs on: http://localhost:3000
- MongoDB runs on: mongodb://localhost:27017

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google login
- `POST /api/auth/session` - Create session from session_id
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Dashboard
- `GET /api/dashboard/stats?month=YYYY-MM` - Get monthly statistics

### Transactions
- `POST /api/sales` - Create sale record
- `GET /api/sales` - List all sales
- `POST /api/expenses` - Create expense record
- `GET /api/expenses` - List all expenses
- `POST /api/investments` - Record investment
- `GET /api/investments` - List all investments
- `POST /api/partner-payments` - Record partner payment
- `GET /api/partner-payments` - List partner payments

### Partners
- `GET /api/partners` - List all partners
- `PUT /api/partners/shares` - Update partner share percentages

### Reports
- `GET /api/reports/monthly?month=YYYY-MM` - Get monthly report

### Users
- `GET /api/users` - List all users

## Database Schema

### Collections

1. **users**: User accounts (partners and employees)
2. **partners**: Partner information and shareholding
3. **sales**: Photography shoot records
4. **expenses**: Business expense records
5. **investments**: Partner investment records
6. **partner_payments**: Monthly profit distributions
7. **user_sessions**: Authentication sessions

## Access Control

Currently, all authenticated users (partners and employees) have full access to all features. Role-based restrictions can be added in future versions.

## Mobile Compatibility

The application is built with a mobile-first approach using Tailwind CSS, making it fully responsive and ready for:
- iOS and Android web browsers
- Progressive Web App (PWA) conversion
- Future React Native migration

## Future Enhancements

- Partner payment tracking and reminders
- Advanced analytics and charts
- Export reports to PDF/Excel
- Multi-currency support
- Role-based access control
- Mobile app (iOS/Android)

## License

Proprietary - Photography Studio Management System