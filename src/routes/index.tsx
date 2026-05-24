import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-medium mb-2">SheetToAPI</h1>
        <p className="text-gray-500 mb-8">
          Turn your Google Sheets into REST API endpoints instantly.
        </p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get started
        </Link>
      </div>
    </div>
  )
}
