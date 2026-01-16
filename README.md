# Web Agency HRM - Frontend

The frontend application for the Web Agency HRM System, built with modern web technologies to provide a responsive and interactive user experience.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (React 19)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Drag & Drop:** [@dnd-kit](https://dndkit.com/)
- **Real-time:** Socket.io-client
- **HTTP Client:** Axios
- **Icons:** [Lucide React](https://lucide.dev/)
- **Validation:** Zod

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- NPM or Yarn

### Installation

1. Navigate to the frontend directory (if not already there):
   ```bash
   cd "HRM frontend"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env.local` file in the root of the `HRM frontend` directory:

```bash
# API Base URL (Point this to your backend server)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Other optional public vars...
```

### Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📦 Building for Production

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## 📂 Project Structure

- `/app`: Next.js App Router pages and layouts.
- `/components`: Reusable UI components (atoms, molecules, organisms).
- `/services`: API service functions.
- `/store`: Zustand state stores.
- `/types`: TypeScript type definitions.
- `/public`: Static assets.

## ✨ Key Features

- **Interactive Dashboard:** Visual analytics and stats.
- **Kanban Board:** manage tasks with drag-and-drop.
- **Responsive UI:** Optimized for desktop and tablets.
- **Dark Mode Support:** (Architecture ready/Implemented).
