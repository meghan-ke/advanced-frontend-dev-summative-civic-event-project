# CivicEvents+

This project is a website for community events. Users can view events, register for them, leave feedback, listen to announcements, and watch promo videos. Admin users can create and manage these items.

## Running the project

### Backend

Open the backend folder and install the packages:

```bash
cd backend
npm install
```

Make sure PostgreSQL is running and the database details in `backend/.env` are correct.

Create the database tables:

```bash
psql -U postgres -d civic-events-db -f ./migrations/001_create_tables.sql
```

Start the server:

```bash
npm run dev
```

The backend runs at `http://localhost:4000`.

### Frontend

Open the frontend folder in VS Code. Open `frontend/index.html` using Live Server or another local web server.

## Accounts

Use **Sign up** to create a regular account.

To make an existing account an admin, open pgAdmin or PostgreSQL and run:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'account@example.com';
```

The user will need to log out and log in again.

To change an admin back to a regular user, run:

```sql
UPDATE users
SET role = 'user'
WHERE email = 'account@example.com';
```

## Using the website

### Regular users

- Choose **Events** to browse events.
- Open an event to view details or register.
- Choose **Announcements** to listen to audio updates.
- Choose **Promos** to watch videos.
- Open the profile menu to view your profile, registrations, or notifications.

Use the back links on detail pages to return to events, announcements, or promos.

### Admin users

The profile menu and main navigation contain the **Dashboard** link.

From the dashboard, an admin can:

- Create and manage events
- Create and manage announcements
- Create and manage promos
- View users
- Manage notifications
- View dashboard statistics

When you are on another admin page, use **Back to admin dashboard** to return to the dashboard.
