# Deployment Guide - Alternative ENS

## Current Status

✅ **Application Deployed to**: 174.138.46.88  
✅ **Environment**: Production with PM2  
✅ **Frontend**: HTTPS configured (self-signed temporarily)  
✅ **Backend**: Running on port 3000 (proxied via nginx)  
✅ **Database**: MySQL configured and accessible  
✅ **CI/CD**: Updated for new droplet  

## Domain Setup Required

### Step 1: Update DNS Records

Change your domain DNS records to point to the new server:

**Domain**: alternatives.nativeworld.com  
**New IP**: 174.138.46.88  

Update your DNS A record:
```
Name: alternatives.nativeworld.com
Type: A
Value: 174.138.46.88
TTL: 3600 (or your preferred value)
```

**Where to update DNS:**
- GoDaddy: https://www.godaddy.com/help/add-an-a-record-19238
- Namecheap: https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-do-i-set-up-host-records-for-a-domain
- DigitalOcean: Use their nameserver DNS panel
- Other registrar: Check their documentation

### Step 2: Update SSL Certificate (After DNS Update)

Once DNS propagates (usually 5-30 minutes), SSH into the server and run:

```bash
ssh -i ~/.ssh/id_rsa root@174.138.46.88
cd /app
./setup-ssl.sh
```

This will:
- Request a proper Let's Encrypt SSL certificate
- Automatically renew it
- Install it in nginx
- Enable automatic renewal

## Testing Access

Once DNS is updated, visit:
```
https://alternatives.nativeworld.com/admin-login
```

Login with:
- **Email**: admin@alternative.com
- **Password**: admin123

## Server Details

**SSH Access**:
```bash
ssh -i ~/.ssh/id_rsa root@174.138.46.88
```

**PM2 Commands**:
```bash
# View status
pm2 status

# View logs
pm2 logs alternative-ens

# Restart application
pm2 restart alternative-ens

# Stop/start
pm2 stop alternative-ens
pm2 start ecosystem.config.cjs
```

**Application Files**:
- Source: `/app`
- Environment config: `/app/.env`
- PM2 config: `/app/ecosystem.config.cjs`
- Nginx config: `/etc/nginx/sites-available/alternatives`
- SSL setup script: `/app/setup-ssl.sh`

## CI/CD Pipeline

GitHub Actions workflows have been updated to:
1. Build the application
2. Deploy to 174.138.46.88 via SSH
3. Rebuild and restart via PM2

**Required Secret**: `DO_SSH_KEY`  
Add your DigitalOcean SSH private key to GitHub Actions secrets:
```
Settings > Secrets and variables > Actions > New repository secret
Name: DO_SSH_KEY
Value: [contents of ~/.ssh/id_rsa]
```

## Database Access

```bash
ssh -i ~/.ssh/id_rsa root@174.138.46.88

# Access MySQL
mysql -u u263459454_alternatives -pv8H56U3Jyejj u263459454_alternatives

# Verify admin user
SELECT * FROM admin_users WHERE email='admin@alternative.com';
```

## Monitoring

```bash
# Real-time logs
pm2 logs alternative-ens

# System status
pm2 monitoring

# Process details
pm2 show alternative-ens
```

## Troubleshooting

**Application not responding**:
```bash
pm2 logs alternative-ens --err  # Check error logs
pm2 restart alternative-ens      # Restart application
```

**Database connection issues**:
```bash
ssh root@174.138.46.88
mysql -u u263459454_alternatives -pv8H56U3Jyejj -h localhost u263459454_alternatives -e "SELECT 1;"
```

**Nginx issues**:
```bash
nginx -t              # Test configuration
systemctl restart nginx # Restart nginx
```

## Next Steps

1. ✅ Update DNS records (REQUIRED)
2. ✅ Run SSL setup script once DNS propagates
3. ✅ Test admin login at https://alternatives.nativeworld.com/admin-login
4. ✅ Verify admin dashboard and CV visibility
5. ✅ Configure GitHub Actions `DO_SSH_KEY` secret for automated deployments

---

**Deployment Date**: 2026-05-11  
**Deployed By**: Claude  
**Server IP**: 174.138.46.88
