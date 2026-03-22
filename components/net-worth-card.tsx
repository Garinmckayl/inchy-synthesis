import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NetWorthCard() {
  return (
    <Card className="bg-[#181c1f] border-gray-800">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Net Worth</CardTitle>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-4">$62.37</div>
        <div className="flex items-center gap-2 text-sm">
          <span>NFTs</span>
          <span className="font-semibold">$43.47</span>
          <span className="text-xl">💜</span>
        </div>
      </CardContent>
    </Card>
  )
}

