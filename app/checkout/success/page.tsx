import { Suspense } from "react"
import SuccessClient from "./SuccessClient"

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Processing payment...</div>}>
      <SuccessClient />
    </Suspense>
  )
}
