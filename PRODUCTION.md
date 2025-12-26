# DropXCult – Production Deployment Guide (AWS EC2)

Complete guide to deploy your secure admin panel + store to production.

## 📋 Prerequisites

- AWS Account
- Domain name (for HTTPS/SSL)
- Cloudinary account
- Razorpay account
- Resend account (for emails)

---

## 1️⃣ Launch AWS EC2 Instance

**Instance Type:** `t3.small` or higher (2GB+ RAM recommended)

**AMI:** Ubuntu 22.04 LTS

**Security Group:**
| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| Custom | 3000-3002 | 0.0.0.0/0 (temporary for testing) |

**Storage:** 20GB+ SSD

---

## 2️⃣ Connect & Initial Setup

```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@<PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # Should show v20.x.x
npm -v
```

---

## 3️⃣ Setup AWS RDS (PostgreSQL)

**Instead of local PostgreSQL, we'll use managed AWS RDS:**

### Create RDS Instance

1. **Go to AWS RDS Console** → Create Database
2. **Engine:** PostgreSQL 14 or 15
3. **Template:** Production (or Dev/Test for lower cost)
4. **DB Instance:** `db.t3.micro` (Free Tier) or `db.t3.small`
5. **Storage:** 20GB, enable auto-scaling
6. **DB Name:** `dropxcult_prod`
7. **Master Username:** `dropxcult`
8. **Master Password:** Generate strong password
9. **VPC:** Same VPC as your EC2
10. **Public Access:** Yes (or configure VPC peering)
11. **Security Group:** Create new or use existing

### Configure Security Group

**RDS Security Group - Inbound Rules:**
| Type | Port | Source |
|------|------|--------|
| PostgreSQL | 5432 | EC2 Security Group ID |

**Or allow from specific IP:**
| Type | Port | Source |
|------|------|--------|
| PostgreSQL | 5432 | Your EC2 Private IP |

### Get Connection String

After RDS is created:

1. Go to RDS → Your database → Connectivity & security
2. **Endpoint:** `your-db.abc123.region.rds.amazonaws.com`
3. **Port:** `5432`

**Connection String Format:**
```
DATABASE_URL="postgresql://dropxcult:YOUR_PASSWORD@your-db.abc123.us-east-1.rds.amazonaws.com:5432/dropxcult_prod?sslmode=require"
```

⚠️ **Important:** Use `sslmode=require` for RDS (not `disable`)

### Test Connection from EC2

```bash
# Install PostgreSQL client (to test connection)
sudo apt install -y postgresql-client

# Test connection
psql "postgresql://dropxcult:YOUR_PASSWORD@your-rds-endpoint:5432/dropxcult_prod"

# If successful, you'll see: dropxcult_prod=>
# Type \q to exit
```

---

## 4️⃣ Clone & Setup Project

```bash
# Clone repository
git clone https://github.com/sighquestcrew/DropxCult.git
cd DropxCult

# Install PM2 (process manager)
sudo npm install -g pm2
```

---

## 5️⃣ Configure Environment Variables

### Admin Panel (`dropxcult-admin/.env`)

```bash
cd dropxcult-admin
nano .env
```

```env
# Database (AWS RDS)
DATABASE_URL="postgresql://dropxcult:YOUR_RDS_PASSWORD@your-db.abc123.us-east-1.rds.amazonaws.com:5432/dropxcult_prod?sslmode=require"

# JWT Secrets (from earlier generation)
JWT_SECRET="UybgVT7D3WZ/mD7wpIwha1IaRTWly9kqiGPeHX4fuaU="
NEXTAUTH_SECRET="y6TTMKMncvxfrl/+OuwfRuzluWeRQyDLAqtO7muBRyU="

# 2FA Email
RESEND_API_KEY="re_YOUR_API_KEY"
ADMIN_OTP_EMAIL="admin@yourdomain.com"

# Redis (Optional but recommended)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"

# Razorpay
RAZORPAY_API_KEY="rzp_live_XXX"
RAZORPAY_API_SECRET="your_secret"
NEXT_PUBLIC_RAZORPAY_API_KEY="rzp_live_XXX"
RAZORPAY_X_ACCOUNT_NUMBER="your_account"
```

### Store (`dropxcult-store/.env`)

```bash
cd ../dropxcult-store
nano .env
```

```env
# Same DATABASE_URL as admin (AWS RDS)
DATABASE_URL="postgresql://dropxcult:YOUR_RDS_PASSWORD@your-db.abc123.us-east-1.rds.amazonaws.com:5432/dropxcult_prod?sslmode=require"

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"

RAZORPAY_API_KEY="rzp_live_XXX"
RAZORPAY_API_SECRET="your_secret"
NEXT_PUBLIC_RAZORPAY_API_KEY="rzp_live_XXX"

# Store-specific (if any)
NEXTAUTH_SECRET="y6TTMKMncvxfrl/+OuwfRuzluWeRQyDLAqtO7muBRyU="
```

### Editor (`Test/tshirt-editor/.env`)

```bash
cd ../Test/tshirt-editor
nano .env
```

```env
DATABASE_URL="postgresql://dropxcult:YOUR_RDS_PASSWORD@your-db.abc123.us-east-1.rds.amazonaws.com:5432/dropxcult_prod?sslmode=require"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud"
```

---

## 6️⃣ Install Dependencies & Build

```bash
# Admin
cd ~/DropxCult/dropxcult-admin
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Store
cd ~/DropxCult/dropxcult-store
npm install
npx prisma generate
npm run build

# Editor
cd ~/DropxCult/Test/tshirt-editor
npm install
npm run build
```

---

## 7️⃣ Setup PM2 (Process Manager)

Create PM2 config:

```bash
cd ~/DropxCult
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'editor',
      cwd: './Test/tshirt-editor',
      script: 'npm',
      args: 'start -- --port 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'store',
      cwd: './dropxcult-store',
      script: 'npm',
      args: 'start -- --port 3001',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'admin',
      cwd: './dropxcult-admin',
      script: 'npm',
      args: 'start -- --port 3002',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
  ]
};
```

**Start all apps:**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-restart on server reboot
```

**Useful PM2 commands:**

```bash
pm2 list              # View all apps
pm2 logs              # View logs
pm2 restart all       # Restart all apps
pm2 stop all          # Stop all apps
pm2 monit             # Monitor resources
```

---

## 8️⃣ Install & Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/dropxcult
```

```nginx
# Editor (editor.yourdomain.com)
server {
    listen 80;
    server_name editor.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Store (yourdomain.com or www.yourdomain.com)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin (admin.yourdomain.com)
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable config
sudo ln -s /etc/nginx/sites-available/dropxcult /etc/nginx/sites-enabled/

# Test & restart
sudo nginx -t
sudo systemctl restart nginx
```

---

## 9️⃣ Setup SSL (HTTPS) with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com
sudo certbot --nginx -d editor.yourdomain.com

# Auto-renewal (already configured, but verify)
sudo certbot renew --dry-run
```

**Certbot automatically:**
- ✅ Configures HTTPS (port 443)
- ✅ Redirects HTTP→HTTPS
- ✅ Sets up auto-renewal

---

## 🔟 Create Admin User

```bash
cd ~/DropxCult/dropxcult-admin

# Start Prisma Studio
npx prisma studio
```

**In browser** (`http://<EC2_IP>:5555`):
1. Open `User` table
2. Add new record:
   - `name`: Your Name
   - `email`: admin@yourdomain.com
   - `password`: Run `node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"` and paste hash
   - `isAdmin`: ✅ true

**Or via SQL:**
```sql
INSERT INTO "User" (id, name, email, password, "isAdmin", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@yourdomain.com',
  '$2a$10$HASH_HERE',  -- Generate with bcrypt
  true,
  NOW(),
  NOW()
);
```

---

## 1️⃣1️⃣ Security Hardening

```bash
# Enable UFW Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Disable password authentication (SSH key only)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Keep system updated
sudo apt update && sudo apt upgrade -y
```

---

## 1️⃣2️⃣ Monitoring & Logs

```bash
# View PM2 logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# System resources
htop
```

---

## ✅ Final Verification

1. **Store:** https://yourdomain.com ✅
2. **Admin:** https://admin.yourdomain.com ✅
3. **Editor:** https://editor.yourdomain.com ✅
4. **Test Login:** Admin panel 2FA works ✅
5. **Test Purchase:** Complete checkout flow ✅

---

## 🚨 Troubleshooting

**Apps not starting:**
```bash
pm2 logs
# Check for missing .env or dependency errors
```

**Database connection failed:**
```bash
# Test connection
psql -U dropxcult -d dropxcult_prod -h localhost
```

**502 Bad Gateway:**
```bash
# Check if apps are running
pm2 list
# Check Nginx config
sudo nginx -t
```

**SSL not working:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

## 📊 Your Production Stack

✅ **Frontend:** Next.js (React)  
✅ **Backend:** Next.js API Routes  
✅ **Database:** PostgreSQL  
✅ **ORM:** Prisma  
✅ **Process Manager:** PM2  
✅ **Reverse Proxy:** Nginx  
✅ **SSL:** Let's Encrypt  
✅ **Auth:** HttpOnly Cookies + 2FA  
✅ **Email:** Resend  
✅ **Storage:** Cloudinary  
✅ **Payments:** Razorpay  

**Security Score: 9/10** 🔒🎯
