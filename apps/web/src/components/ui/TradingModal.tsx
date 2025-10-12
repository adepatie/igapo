import React, { useState } from "react";
import { EconomyState, SupplyState } from "@igapo/shared";

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  economy: EconomyState;
  supplies: SupplyState;
  onExecuteTrade: (tradeData: TradeData) => void;
  traderName?: string;
  availableItems?: TradeItem[];
}

interface TradeData {
  type: "buy" | "sell";
  item: string;
  quantity: number;
  price: number;
}

interface TradeItem {
  id: string;
  name: string;
  category: "supply" | "special";
  buyPrice: number;
  sellPrice: number;
  available: boolean;
}

const TradingModal: React.FC<TradingModalProps> = ({
  isOpen,
  onClose,
  economy,
  supplies,
  onExecuteTrade,
  traderName = "Trader",
  availableItems = [],
}) => {
  const [selectedItem, setSelectedItem] = useState<TradeItem | null>(null);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const handleTrade = () => {
    if (!selectedItem) return;

    const tradeData: TradeData = {
      type: tradeType,
      item: selectedItem.id,
      quantity,
      price:
        tradeType === "buy" ? selectedItem.buyPrice : selectedItem.sellPrice,
    };

    onExecuteTrade(tradeData);
    setSelectedItem(null);
    setQuantity(1);
  };

  const getItemQuantity = (item: TradeItem) => {
    if (item.category === "supply") {
      return supplies[item.id as keyof SupplyState] || 0;
    }
    return economy.barterGoods[item.id] || 0;
  };

  const getTotalCost = () => {
    if (!selectedItem) return 0;
    const price =
      tradeType === "buy" ? selectedItem.buyPrice : selectedItem.sellPrice;
    return price * quantity;
  };

  const canAfford = () => {
    if (!selectedItem || tradeType === "sell") return true;
    return economy.currencyAmount >= getTotalCost();
  };

  const canSell = (item: TradeItem) => {
    return getItemQuantity(item) >= quantity;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} mil-réis`;
  };

  return (
    <div className="trading-modal-overlay">
      <div className="trading-modal">
        <div className="trading-header">
          <h2>Trading with {traderName}</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="trading-content">
          <div className="economy-status">
            <div className="currency-display">
              <span className="currency-icon">💰</span>
              <span className="currency-amount">
                {formatCurrency(economy.currencyAmount)}
              </span>
            </div>
          </div>

          <div className="trading-section">
            <div className="items-list">
              <h3>Available Items</h3>
              {availableItems.length > 0 ? (
                <div className="items-grid">
                  {availableItems.map((item) => (
                    <div
                      key={item.id}
                      className={`item-card ${
                        selectedItem?.id === item.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="item-name">{item.name}</div>
                      <div className="item-prices">
                        <span className="buy-price">
                          Buy: {formatCurrency(item.buyPrice)}
                        </span>
                        <span className="sell-price">
                          Sell: {formatCurrency(item.sellPrice)}
                        </span>
                      </div>
                      <div className="item-quantity">
                        You have: {getItemQuantity(item)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-items">No items available for trade</p>
              )}
            </div>

            {selectedItem && (
              <div className="trade-controls">
                <h3>Trade Details</h3>
                <div className="trade-item-info">
                  <span className="item-name">{selectedItem.name}</span>
                  <span className="item-category">{selectedItem.category}</span>
                </div>

                <div className="trade-type-selector">
                  <label>
                    <input
                      type="radio"
                      name="tradeType"
                      value="buy"
                      checked={tradeType === "buy"}
                      onChange={(e) =>
                        setTradeType(e.target.value as "buy" | "sell")
                      }
                    />
                    Buy
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="tradeType"
                      value="sell"
                      checked={tradeType === "sell"}
                      onChange={(e) =>
                        setTradeType(e.target.value as "buy" | "sell")
                      }
                      disabled={getItemQuantity(selectedItem) === 0}
                    />
                    Sell
                  </label>
                </div>

                <div className="quantity-controls">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    max={
                      tradeType === "sell" ? getItemQuantity(selectedItem) : 99
                    }
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="trade-summary">
                  <div className="total-cost">
                    Total: {formatCurrency(getTotalCost())}
                  </div>
                  {tradeType === "buy" && !canAfford() && (
                    <div className="insufficient-funds">Insufficient funds</div>
                  )}
                  {tradeType === "sell" && !canSell(selectedItem) && (
                    <div className="insufficient-items">Not enough items</div>
                  )}
                </div>

                <button
                  className="execute-trade-button"
                  onClick={handleTrade}
                  disabled={
                    !canAfford() ||
                    (tradeType === "sell" && !canSell(selectedItem))
                  }
                >
                  {tradeType === "buy" ? "Buy" : "Sell"} {quantity}{" "}
                  {selectedItem.name}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingModal;
