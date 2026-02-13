#!/bin/bash

echo "🛍️  TealMart - Quick Setup Script"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env and add your credentials before continuing"
    echo ""
    read -p "Press enter when you've configured .env..."
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

echo ""
read -p "Would you like to seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npm run db:seed
    echo "✅ Database seeded with sample products"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To start the ingestion service:"
echo "  cd ingestion"
echo "  pip install -r requirements.txt"
echo "  python main.py"
echo ""
echo "Access the application at:"
echo "  Storefront: http://localhost:3000"
echo "  Admin: http://localhost:3000/admin"
echo "  Ingestion API: http://localhost:8000"
echo ""
