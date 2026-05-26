import { registerFn } from '#/modules/auth/auth.api'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

export const Route = createFileRoute('/register')({
  component: RouteComponent,
})

function RouteComponent() {
  const register = useServerFn(registerFn)
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
  })

  async function handleRegisterUser() {
    await register({
      data: {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
      },
    })
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <nav className="flex items-center px-8 h-14 border-b border-hairline shrink-0">
        <Link to="/" className="text-ink text-[14px] font-medium tracking-[-0.14px]">
          SheetToAPI
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm bg-surface-1 rounded-[20px] p-8 border border-hairline">
          <h1
            className="text-ink font-semibold mb-2 tracking-[-0.05em]"
            style={{ fontSize: '32px', lineHeight: '1.13' }}
          >
            Create account
          </h1>
          <p
            className="text-ink-muted text-[15px] tracking-[-0.15px] mb-8"
            style={{ lineHeight: '1.30' }}
          >
            Start turning sheets into API endpoints
          </p>

          <div className="flex flex-col gap-3 mb-6">
            <input
              className="w-full bg-surface-2 text-ink text-[15px] border border-hairline rounded-[10px] px-[14px] py-[10px] outline-none placeholder:text-ink-muted focus:border-[#0099ff]/50 focus:shadow-[0_0_0_1px_rgba(0,153,255,0.15)] transition-all tracking-[-0.15px]"
              placeholder="Name"
              onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
            />
            <input
              className="w-full bg-surface-2 text-ink text-[15px] border border-hairline rounded-[10px] px-[14px] py-[10px] outline-none placeholder:text-ink-muted focus:border-[#0099ff]/50 focus:shadow-[0_0_0_1px_rgba(0,153,255,0.15)] transition-all tracking-[-0.15px]"
              placeholder="Email"
              type="email"
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            />
            <input
              className="w-full bg-surface-2 text-ink text-[15px] border border-hairline rounded-[10px] px-[14px] py-[10px] outline-none placeholder:text-ink-muted focus:border-[#0099ff]/50 focus:shadow-[0_0_0_1px_rgba(0,153,255,0.15)] transition-all tracking-[-0.15px]"
              placeholder="Password"
              type="password"
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            />
          </div>

          <button
            type="button"
            onClick={handleRegisterUser}
            className="w-full text-[14px] font-medium leading-none px-[15px] py-[10px] rounded-full bg-white text-black hover:opacity-90 transition-opacity"
          >
            Create account
          </button>

          <p className="text-ink-muted text-[13px] text-center mt-6 tracking-[-0.13px]">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
