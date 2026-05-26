import { registerFn } from '#/modules/auth/auth.api'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

export const Route = createFileRoute('/register')({
  component: RouteComponent,
})

function RouteComponent() {
  const register = useServerFn(registerFn)
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: ""
  })
  async function handleRegisterUser() {
    await register({
      data: {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
      }
    })
  }
  return (
    <div>
      <div>
        <input className='p-2 rounded-lg border border-gray-400 shadow-lg' placeholder='Name' onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} />
        <input className='p-2 rounded-lg border border-gray-400 shadow-lg' placeholder='Email' type='email' onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} />
        <input className='p-2 rounded-lg text-white font-medium border-gray-900 shadow-lg' placeholder='Password' type='password' onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} />
        <button onClick={handleRegisterUser}>Register</button>
      </div>
    </div>
  )
}
