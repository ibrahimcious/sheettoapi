import { createFileRoute } from '@tanstack/react-router'

const BASE_URL = 'https://sheettoapi.net'

export const Route = createFileRoute('/docs')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='max-w-3xl mx-auto p-8'>
      <h1 className='text-3xl font-medium mb-2'>API Documentation</h1>
      <p className='text-gray-500 mb-8'>Learn how to use SheetToAPI endpoints.</p>

      {/* Base URL */}
      <section className='mb-8'>
        <h2 className='text-xl font-medium mb-2'>Base URL</h2>
        <code className='bg-gray-100 px-3 py-2 rounded block text-sm'>
          {BASE_URL}/api/sheet
        </code>
      </section>

      {/* Authentication */}
      <section className='mb-8'>
        <h2 className='text-xl font-medium mb-2'>Authentication</h2>
        <p className='text-gray-500 text-sm mb-2'>
          Every request must include your API key in the request header.
        </p>
        <code className='bg-gray-100 px-3 py-2 rounded block text-sm'>
          X-API-Key: your-api-key
        </code>
      </section>

      {/* Get all rows */}
      <section className='mb-8'>
        <h2 className='text-xl font-medium mb-2'>Get all rows</h2>
        <div className='flex items-center gap-2 mb-2'>
          <span className='bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded'>GET</span>
          <code className='text-sm'>/api/sheet/{'{slug}'}</code>
        </div>
        <p className='text-gray-500 text-sm mb-4'>
          Returns all rows from the connected sheet as a JSON array.
        </p>

        {/* Example request */}
        <p className='text-sm font-medium mb-1'>Example request:</p>
        <pre className='bg-gray-100 px-3 py-2 rounded text-sm mb-4 overflow-x-auto'>
          {`curl ${BASE_URL}/api/sheet/my-slug \\
  -H "X-API-Key: your-api-key"`}
        </pre>

        {/* Example response */}
        <p className='text-sm font-medium mb-1'>Example response:</p>
        <pre className='bg-gray-100 px-3 py-2 rounded text-sm overflow-x-auto'>
          {`[
  { "id": "1", "name": "Tom", "age": "15" },
  { "id": "2", "name": "Alex", "age": "24" }
]`}
        </pre>
      </section>

      {/* Tab parameter */}
      <section className='mb-8'>
        <h2 className='text-xl font-medium mb-2'>Select a specific tab</h2>
        <div className='flex items-center gap-2 mb-2'>
          <span className='bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded'>GET</span>
          <code className='text-sm'>/api/sheet/{'{slug}'}?tab=SheetName</code>
        </div>
        <p className='text-gray-500 text-sm mb-4'>
          Use the <code className='bg-gray-100 px-1 rounded'>tab</code> query parameter to fetch data from a specific sheet tab.
        </p>
        <pre className='bg-gray-100 px-3 py-2 rounded text-sm overflow-x-auto'>
          {`curl "${BASE_URL}/api/sheet/my-slug?tab=Sheet2" \\
  -H "X-API-Key: your-api-key"`}
        </pre>
      </section>

      {/* Error responses */}
      <section className='mb-8'>
        <h2 className='text-xl font-medium mb-2'>Error responses</h2>
        <div className='flex flex-col gap-3'>
          <div className='border p-3 rounded'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded'>401</span>
              <code className='text-sm'>Invalid API key</code>
            </div>
            <p className='text-gray-500 text-sm'>API key is missing or incorrect.</p>
          </div>
          <div className='border p-3 rounded'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded'>404</span>
              <code className='text-sm'>Endpoint not found</code>
            </div>
            <p className='text-gray-500 text-sm'>The slug does not exist.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
