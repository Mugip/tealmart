import { Suspense } from "react"
import SuccessClient from "./SuccessPageClient"

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Processing payment...</div>}>
      <SuccessClient />
    </Suspense>
  )
}
