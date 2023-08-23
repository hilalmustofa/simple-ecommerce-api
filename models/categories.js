module.exports = (sequelize, DataTypes) => {
    const Categories = sequelize.define(
      "Categories",
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        icon: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        }
      },
      {
        tableName: "Categories",
        paranoid: true
      }
    );
  
    Categories.associate = (models) => {
      Categories.hasMany(models.Products, {
        foreignKey: "categoryId",
        onDelete: "CASCADE",
        as: "products"
      });
    };
  
    return Categories;
  };
  