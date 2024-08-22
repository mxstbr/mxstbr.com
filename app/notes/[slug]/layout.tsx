import { Toaster } from 'react-hot-toast'

export default function NotePageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster position="bottom-center" toastOptions={{ duration: 2000 }} />
    </>
  )
}
