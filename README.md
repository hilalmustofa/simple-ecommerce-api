# Simple Ecommerce API

![logo](https://i.ibb.co/N9n5pjC/ecommerce.png)

## Tech Stack
- **NodeJS** of course
- **Express** for api routing
- **Express-Rate-Limit** for rate limiter
- **Mysql** for the database
- **Sequelize** for the ORM
- **Jsonwebtoken** & **BcryptJS** for the Authentication Middleware
- *more in package.json*


## Usage

- clone this repo
- make .env file inside your root project with this structure
```bash
#FE url (for your web, if any)
feurl=your_future_fe_url
# For local development
db_username_dev=your_db_username_for_dev
db_password_dev=your_db_password_for_dev
db_dev=your_db_name_for_dev
secret=your_secret_for_dev (can be anything, even "test")

# For production
db_username_prod=your_db_username_for_prod
db_password_prod=your_db_password_for_prod
db_prod=your_db_name_for_prod
secret=your_secret_for_prod (for production, better use long unpredictable text & hashed in SHA256)
```
- install dependencies
```bash
npm install
```
- run your mysql server
- run the db migration
```bash
npx sequelize db:create
npx sequelize db:migrate
```
- run the api server
```bash
npm run start
```

### Features
#### 1. Users (CRUD)
- RBAC (availabel roles : admin & user)
- Register (first user to register will automatically assigned as admin, the rest is user but it can be changed into admin later)
- Login
- User profile
- Edit user (currently only admin can edit users)
- Delete user (also admin only)

#### 2. Categories (CRUD)
- Only admin can manage categories (Create, Update, Delete)
- Each category will have list of products
- Deleting category will also delete it's products

#### 3. Products (CRUD)
- All roles can create product
- Products are associated to each user which means user can only manage their own product
- Stock management

#### 4. Orders (CRUD)
- All roles can order product
- Total price automatically calculated based on price * quantity
- Order are associated to each user, same as product
- Ordering product will reduce product's stock
- Deleting an order will restore product's stock

#### 5. Standardized responses

For response with data:
```json
{
    "code" : ,
    "data" : ,
    "message" : 
}
```

For response without data:
```json
{
    "code" : ,
    "message" : 
}
```

## Work In Progress
- Creating Front-End
- Bughunt & Bugfix

## Postman Collection
- [Collection](https://api.postman.com/collections/23671827-ddc6988e-54a2-4a9f-a00e-82994a6ae685?access_key=PMAT-01H8GGF2DSQ298SKXKRREBPFYY)
- Environment (create one)

`url=http://localhost:4000`

`access_token`