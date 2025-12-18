export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 safe-top safe-bottom px-4 py-8">
      <div className="max-w-md w-full space-y-8 p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}
