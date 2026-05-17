# Tankua Database SQL Scripts

This folder contains all SQL scripts needed to set up your Supabase database for the Tankua app.

## 📋 Execution Order

Run these scripts **in order** in the Supabase SQL Editor:

### 1. Create Tables (`01_create_tables.sql`)
**Required** - Creates all database tables and indexes
- Users
- Destinations (see migrations 15–16; legacy scripts may reference historical table names)
- Trips
- Pickup Stations
- Trip-Station links (junction table)
- Bookings
- Drivers

**Time**: ~30 seconds

### 2. Enable RLS (`02_enable_rls.sql`)
**Required** - Enables Row Level Security and creates policies
- Protects user data
- Allows public reading of destinations/trips/stations
- Restricts admin operations
- Controls booking access

**Time**: ~30 seconds

### 3. Seed Sample Data (`03_seed_data.sql`)
**Required for testing** - Adds sample data
- 5 Ethiopian destinations (Addis Ababa, Lalibela, Axum, Bahir Dar, Gondar)
- 7 pickup stations in Addis Ababa
- 5 sample drivers

**Time**: ~10 seconds

### 4. Create Sample Trips (`04_create_sample_trips.sql`)
**Optional but recommended** - Creates trips with linked stations
- 5 sample trips (various dates and types)
- Pickup stations linked with times and prices
- Ready for immediate testing

**Time**: ~10 seconds

## 🚀 Quick Start

1. **Open Supabase Dashboard**
   - Go to your project
   - Click **SQL Editor** in sidebar

2. **Run Each Script**
   - Click **New Query**
   - Copy contents of `01_create_tables.sql`
   - Click **RUN**
   - Repeat for scripts 02, 03, and 04

3. **Verify**
   - Go to **Table Editor**
   - Check that all tables exist
   - Verify sample data is present

## 📊 What You'll Get

After running all scripts:

### Tables Created (7)
- ✅ `users` - User profiles
- ✅ `destinations` - Destination information (renamed from legacy schema)
- ✅ `trips` - Available trips
- ✅ `pickup_stations` - Pickup locations
- ✅ `trip_pickup_stations` - Station-trip links
- ✅ `bookings` - User bookings
- ✅ `drivers` - Driver information

### Sample Data
- ✅ 5 Destinations with real Ethiopian locations
- ✅ 7 Pickup stations in Addis Ababa
- ✅ 5 Drivers with vehicle info
- ✅ 5 Sample trips (if you ran script 04)
- ✅ Pickup stations linked to trips

### Security
- ✅ Row Level Security enabled
- ✅ Users can only see their own bookings
- ✅ Admin-only operations protected
- ✅ Public reading of destinations/trips/stations

## 🔍 Verify Your Setup

### Check Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check Sample Data Count
```sql
SELECT 
  (SELECT COUNT(*) FROM churches) as churches,
  (SELECT COUNT(*) FROM pickup_stations) as stations,
  (SELECT COUNT(*) FROM drivers) as drivers,
  (SELECT COUNT(*) FROM trips) as trips;
```

### View Sample Churches
```sql
SELECT id, name, city, distance 
FROM churches 
ORDER BY distance;
```

### View Trips with Pickup Stations
```sql
SELECT 
  t.date,
  t.trip_type,
  c.name as church_name,
  COUNT(tps.id) as pickup_stations_count
FROM trips t
JOIN churches c ON c.id = t.church_id
LEFT JOIN trip_pickup_stations tps ON tps.trip_id = t.id
GROUP BY t.id, t.date, t.trip_type, c.name
ORDER BY t.date;
```

## 🛠️ Troubleshooting

### Error: "relation already exists"
**Solution**: Tables already created. Skip to next script or drop tables first:
```sql
DROP TABLE IF EXISTS bookings, trip_pickup_stations, trips, 
  pickup_stations, churches, drivers, users CASCADE;
```

### Error: "permission denied"
**Solution**: Make sure you're logged in and have admin access to your project

### Error: "policy already exists"
**Solution**: Policies already created. Safe to ignore or drop and recreate

### No data showing in app
**Solution**: 
1. Check Table Editor - verify data exists
2. Make sure you're logged in (test phone: +251900000000)
3. Check RLS policies are enabled

## 📝 Customization

### Add More Churches
Edit `03_seed_data.sql` and add more INSERT statements:
```sql
INSERT INTO churches (name, description, region, city, distance, images, tags, location) VALUES
  (
    'Your Church Name',
    'Description',
    'Region',
    'City',
    distance_in_km,
    ARRAY['image_url'],
    ARRAY['tag1', 'tag2'],
    '{"lat": latitude, "lng": longitude}'::jsonb
  );
```

### Add More Pickup Stations
```sql
INSERT INTO pickup_stations (name, city, address, lat, lng) VALUES
  ('Station Name', 'City', 'Full Address', latitude, longitude);
```

### Modify Trip Prices
Edit `04_create_sample_trips.sql` and change the `price` values

## 🔗 Next Steps

After running all SQL scripts:

1. ✅ **Enable Phone Auth**
   - Authentication → Providers → Phone
   - Add test number: +251900000000 (OTP: 123456)

2. ✅ **Test Your App**
   ```bash
   npm install
   npm start
   ```

3. ✅ **Login**
   - Use test phone number
   - Browse churches
   - Try booking a trip

4. ✅ **Make Yourself Admin**
   - Table Editor → users → your user
   - Set `is_admin = true`
   - Restart app → See Admin tab

## 📚 Related Documentation

- **[doc/SUPABASE_SETUP.md](../doc/SUPABASE_SETUP.md)** - Complete Supabase setup guide
- **[doc/QUICK_START.md](../doc/QUICK_START.md)** - 15-minute quick start
- **[README.md](../README.md)** - App overview

## 💡 Tips

- Run scripts in SQL Editor, not Table Editor
- Check for errors in the bottom panel
- Refresh Table Editor to see new data
- Use CMD/CTRL + Enter to run queries quickly
- Save queries for future reference

---

**Ready to build?** Run the scripts and start testing! 🚀

