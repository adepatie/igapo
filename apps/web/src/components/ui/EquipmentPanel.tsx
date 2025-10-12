import React from "react";

interface EquipmentItem {
  itemId: string;
  itemType: "weapon" | "tool" | "artifact" | "map";
  name: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  effects: Record<string, number>;
  culturalSignificance?: string;
  acquiredAt: number;
  acquiredFrom?: string;
}

interface EquipmentPanelProps {
  equipment: EquipmentItem[];
  onItemClick?: (item: EquipmentItem) => void;
  onItemRemove?: (itemId: string) => void;
}

const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  equipment,
  onItemClick,
  onItemRemove,
}) => {
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "#FFFFFF",
      uncommon: "#32CD32",
      rare: "#4169E1",
      legendary: "#FFD700",
    };
    return colors[rarity as keyof typeof colors] || "#FFFFFF";
  };

  const getRarityLabel = (rarity: string) => {
    const labels = {
      common: "Common",
      uncommon: "Uncommon",
      rare: "Rare",
      legendary: "Legendary",
    };
    return labels[rarity as keyof typeof labels] || rarity;
  };

  const getItemTypeIcon = (itemType: string) => {
    const icons = {
      weapon: "⚔️",
      tool: "🔧",
      artifact: "🏺",
      map: "🗺️",
    };
    return icons[itemType as keyof typeof icons] || "📦";
  };

  const getItemTypeLabel = (itemType: string) => {
    const labels = {
      weapon: "Weapon",
      tool: "Tool",
      artifact: "Artifact",
      map: "Map",
    };
    return labels[itemType as keyof typeof labels] || itemType;
  };

  const formatEffects = (effects: Record<string, number>) => {
    return Object.entries(effects).map(([effect, value]) => {
      const percentage = Math.round((value - 1) * 100);
      const sign = percentage >= 0 ? "+" : "";
      return `${effect}: ${sign}${percentage}%`;
    });
  };

  const formatAcquiredTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const groupEquipmentByType = () => {
    const grouped = {
      weapon: [],
      tool: [],
      artifact: [],
      map: [],
    };

    equipment.forEach((item) => {
      if (grouped[item.itemType]) {
        grouped[item.itemType].push(item);
      }
    });

    return grouped;
  };

  const groupedEquipment = groupEquipmentByType();

  return (
    <div className="equipment-panel">
      <div className="equipment-header">
        <h3>Equipment</h3>
        <div className="equipment-count">{equipment.length} items</div>
      </div>

      <div className="equipment-content">
        {Object.entries(groupedEquipment).map(([type, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={type} className="equipment-category">
              <div className="category-header">
                <span className="category-icon">{getItemTypeIcon(type)}</span>
                <span className="category-label">{getItemTypeLabel(type)}</span>
                <span className="category-count">{items.length}</span>
              </div>

              <div className="equipment-items">
                {items.map((item) => (
                  <div
                    key={item.itemId}
                    className="equipment-item"
                    onClick={() => onItemClick?.(item)}
                  >
                    <div className="item-header">
                      <div className="item-name">{item.name}</div>
                      <div className="item-rarity">
                        <span
                          className="rarity-badge"
                          style={{ color: getRarityColor(item.rarity) }}
                        >
                          {getRarityLabel(item.rarity)}
                        </span>
                      </div>
                    </div>

                    <div className="item-description">{item.description}</div>

                    {item.culturalSignificance && (
                      <div className="item-cultural">
                        <span className="cultural-label">Cultural:</span>
                        <span className="cultural-text">
                          {item.culturalSignificance}
                        </span>
                      </div>
                    )}

                    {Object.keys(item.effects).length > 0 && (
                      <div className="item-effects">
                        <span className="effects-label">Effects:</span>
                        <div className="effects-list">
                          {formatEffects(item.effects).map((effect, index) => (
                            <span key={index} className="effect-item">
                              {effect}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="item-meta">
                      <div className="item-acquired">
                        Acquired: {formatAcquiredTime(item.acquiredAt)}
                      </div>
                      {item.acquiredFrom && (
                        <div className="item-source">
                          From: {item.acquiredFrom}
                        </div>
                      )}
                    </div>

                    {onItemRemove && (
                      <button
                        className="remove-item-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemRemove(item.itemId);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {equipment.length === 0 && (
          <div className="empty-equipment">
            <div className="empty-icon">📦</div>
            <div className="empty-text">
              No equipment yet. Explore locations to find items!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentPanel;
