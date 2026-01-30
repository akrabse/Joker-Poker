import { useState } from 'react'
import { motion } from 'framer-motion'

export default function BuyInModal({ userChips, onBuyIn, onClose }) {
  const [amount, setAmount] = useState(500)
  const [customAmount, setCustomAmount] = useState('')

  const quickOptions = [
    { chips: 500, price: 2 },
    { chips: 1000, price: 3.5 },
    { chips: 1500, price: 4 },
  ]

  const handleQuickBuy = (chips) => {
    if (chips <= userChips) {
      onBuyIn(chips)
    } else {
      alert('Not enough chips in your account!')
    }
  }

  const handleCustomBuy = () => {
    const chips = parseInt(customAmount)
    if (chips < 100) {
      alert('Minimum buy-in is 100 chips')
      return
    }
    if (chips > userChips) {
      alert('Not enough chips in your account!')
      return
    }
    onBuyIn(chips)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-poker-light rounded-2xl p-8 max-w-md w-full"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Buy Chips</h2>
        <p className="text-gray-400 mb-6">
          Available: <span className="text-poker-gold font-bold">{userChips} chips</span>
        </p>

        {/* Quick Options */}
        <div className="space-y-3 mb-6">
          {quickOptions.map((option) => (
            <button
              key={option.chips}
              onClick={() => handleQuickBuy(option.chips)}
              className="w-full bg-poker-darker hover:bg-poker-dark rounded-lg p-4 text-left transition-colors"
              disabled={option.chips > userChips}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-bold">{option.chips} Chips</p>
                  <p className="text-gray-400 text-sm">€{option.price} value</p>
                </div>
                <span className="text-poker-gold font-bold">→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="mb-6">
          <label className="block text-white mb-2">Custom Amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount..."
              className="input-field flex-1"
              min="100"
            />
            <button onClick={handleCustomBuy} className="btn-primary px-6">
              Buy
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            15% discount for 1000+ chips (except quick options)
          </p>
        </div>

        <button onClick={onClose} className="w-full btn-secondary">
          Cancel
        </button>
      </motion.div>
    </div>
  )
}
