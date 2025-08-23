# 🏃‍♂️ Strava Dashboard

A modern, feature-rich dashboard for Strava athletes built with Next.js 15, TypeScript, and Tailwind CSS. Track your fitness goals, monitor personal records, and analyze your performance data in one beautiful interface.

![Dashboard Overview](./assets/Screenshot%202025-08-22%20at%2011.38.15%20PM.png)

## ✨ Features

### 📊 **Activity Statistics**
- **Total Activities**: Track your overall activity count
- **Total Distance**: Monitor cumulative distance across all activities
- **Elevation Gain**: Track total climbing across all activities
- **Total Time**: See your total time spent exercising

### 🎯 **Goal Tracking**
- Set and track fitness goals
- Visual progress indicators
- Motivational reminders to stay on track
- Create your first goal with an intuitive interface

### ⚙️ **Gear Tracker**
- Monitor usage across different gear items
- Track mileage on running shoes, bikes, and other equipment
- Get alerts when gear needs attention or replacement

### 🏆 **Personal Records**
![Personal Records](./assets/Screenshot%202025-08-22%20at%2011.38.28%20PM.png)

- **Comprehensive PR Tracking**: View all your personal records across different distances
- **PR Distribution**: Visual breakdown of running vs cycling PRs
- **Biggest Improvements**: Track your most significant performance gains
- **Distance Categories**: 1K, 5K, 10K, Half Marathon, Marathon, and more
- **Progress Trends**: Visualize performance improvements over time
- **Achievement Tracking**: Monitor PR achievements and recent performances

### 🏅 **Achievement Progress**
- Time-based achievements
- Activity milestones
- Visual progress indicators
- Categories for different achievement types

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Strava account with API access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/strava-nextjs-app.git
cd strava-nextjs-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **API Integration**: Strava API v3

## 📁 Project Structure

```
strava-nextjs-app/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/             # API routes
│   │   ├── dashboard/       # Dashboard pages
│   │   └── personal-records/ # PR tracking pages
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   └── dashboard/      # Dashboard-specific components
│   ├── lib/                # Utility functions and libraries
│   ├── store/              # Redux store configuration
│   └── types/              # TypeScript type definitions
├── public/                  # Static assets
└── assets/                  # Screenshots and images
```

## 🧪 Testing

Run the test suite:
```bash
npm run test
# or
npm run test:run  # Run tests once without watch mode
```

## 📦 Building for Production

```bash
npm run build
npm run start
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Strava API for providing athlete data
- Next.js team for the amazing framework
- All contributors and users of this dashboard

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/strava-nextjs-app/issues) on GitHub.

---

Built with ❤️ by athletes, for athletes