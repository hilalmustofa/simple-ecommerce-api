module.exports = (sequelize, DataTypes) => {
    const Orders = sequelize.define(
      "Orders",
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        amount: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        tableName: "Orders",
      }
    );
  
    Orders.associate = (models) => {
      Orders.belongsTo(models.Products, {
        foreignKey: "productId",
      });
      Orders.belongsTo(models.Users, {
        foreignKey: "userId",
      });
    };
  
    return Orders;
  };
  