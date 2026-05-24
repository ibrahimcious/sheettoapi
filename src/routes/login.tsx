import { loginWithGoogleServerFn } from '#/modules/auth/auth.api'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  //const loginServerFnHandler = useServerFn(loginServerFn)
  const loginWithGoogleServerHandler = useServerFn(loginWithGoogleServerFn)
  //const [loginData, setLoginData] = useState({
  // email: "",
  //password: ""
  // })
  {/* async function handleLoginUser() {
    await loginServerFnHandler({
      data: {
        email: loginData.email,
        password: loginData.password,
      }
    })
  }
  */}
  async function handleLoginWithGoogle() {
    await loginWithGoogleServerHandler()
  }
  return (
    <div>
      <div>
        {/*<input className='p-2 rounded-lg border border-gray-400 shadow-lg' placeholder='Email' type='email' onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
        <input className='p-2 rounded-lg text-white font-medium border-gray-900 shadow-lg' placeholder='Password' type='password' onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
        <button type='button' onClick={handleLoginUser}>Login</button>
        */}
        <button className='p-2 rounded-lg bg-blue-900 text-white font-medium shadow-lg' type='button' onClick={handleLoginWithGoogle}>Continue with Google</button>
      </div>
    </div>
  )
}
