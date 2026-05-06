import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/config/firebase'
import { useAuthStore } from '@/store/authStore'
import router from '@/router'
import LoadingScreen from '@/components/layout/LoadingScreen'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  const { setUser, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [setUser, setLoading])

  if (isLoading) return <LoadingScreen />

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}
