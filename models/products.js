module.exports = (sequelize, DataTypes) => {
    const Products = sequelize.define(
      "Products",
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        picture: {
          type: DataTypes.STRING,
          allowNull: false
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        price: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        stock: {
          type: DataTypes.INTEGER,
          allowNull: false
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
        tableName: "Products",
        paranoid: true
      }
    );
  
    Products.associate = (models) => {
      Products.belongsTo(models.Categories, {
        foreignKey: "categoryId",
      });
    };
  
    return Products;
  };
  