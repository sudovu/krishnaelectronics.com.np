const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Krishna Electronics & Order Suppliers...');

  // 1. Initial Admin User
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@krishnaelectronics.com.np';
  const rawPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Krishna Electronics Administrator',
      role: 'SUPER_ADMIN',
    },
    create: {
      email: adminEmail,
      name: 'Krishna Electronics Administrator',
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log(`✓ Admin user upserted: ${admin.email}`);

  // 2. Site Settings
  await prisma.setting.upsert({
    where: { id: 'site-settings' },
    update: {},
    create: {
      id: 'site-settings',
      siteName: 'Krishna Electronics & Order Suppliers',
      siteTagline: 'Premium Electronics, IoT Solutions & Professional Technical Services in Surkhet',
      siteDescription: 'Leading electronics sales, IoT smart home solutions, enterprise networking, CCTV surveillance, chip-level laptop & computer repair, and Annual Maintenance Contracts (AMC) in Birendranagar, Surkhet, Nepal.',
      contactPhone: '', // Configurable via Admin Panel
      contactEmail: '', // Configurable via Admin Panel
      contactWhatsapp: '', // Configurable via Admin Panel
      locationAddress: 'Birendranagar-6, Buddhapath, Surkhet, Nepal',
      businessHours: 'Sunday – Friday: 9:30 AM – 6:30 PM | Saturday: Closed (On-call emergency technical support)',
      googleMapsEmbedUrl: '', // Configurable via Admin Panel
      socialFacebook: '',
      socialInstagram: '',
      socialLinkedin: '',
      socialYoutube: '',
      deliveryInfo: 'Prompt local delivery across Surkhet Valley and scheduled courier dispatch throughout Karnali Province.',
      paymentMethods: 'Cash on Delivery (Surkhet), Bank Transfer, Fonepay / QR, eSewa, Khalti',
      currencyCode: 'NPR',
      currencySymbol: 'रु',
      taxRatePercent: 13.0,
      maintenanceMode: false,
      metaTitle: 'Krishna Electronics & Order Suppliers | Surkhet, Nepal',
      metaDescription: 'Trusted electronics retail, IoT smart devices, networking solutions, CCTV security & computer repair center in Surkhet, Nepal.',
    },
  });
  console.log('✓ Site settings configured');

  // 3. Categories & Subcategories
  const categoriesData = [
    {
      name: 'Laptops & Computers',
      slug: 'laptops-and-computers',
      description: 'Laptops, business desktops, gaming systems, monitors, and custom computing hardware.',
      icon: 'Laptop',
      orderIndex: 1,
      subcategories: ['Business Laptops', 'Gaming Laptops', 'Desktop PCs', 'Monitors & Displays', 'PC Components & Storage']
    },
    {
      name: 'Networking & Connectivity',
      slug: 'networking-and-connectivity',
      description: 'Enterprise routers, gigabit switches, high-gain access points, Wi-Fi 6 mesh, and fiber/cabling supplies.',
      icon: 'Wifi',
      orderIndex: 2,
      subcategories: ['Wireless Routers', 'Managed & Unmanaged Switches', 'Access Points & Mesh', 'Fiber & Cat6 Cabling', 'Network Accessories']
    },
    {
      name: 'CCTV & Surveillance',
      slug: 'cctv-and-surveillance',
      description: 'High-definition security cameras, NVR/DVR storage, smart video doorbells, and complete surveillance packages.',
      icon: 'ShieldAlert',
      orderIndex: 3,
      subcategories: ['IP Cameras', 'HD Analog Cameras', 'NVR & DVR Systems', 'Surveillance Hard Drives', 'Mounts & Power Supplies']
    },
    {
      name: 'IoT & Smart Devices',
      slug: 'iot-and-smart-devices',
      description: 'Next-generation smart switches, IoT relays, environmental sensors, automated lighting, and telemetry hardware.',
      icon: 'Cpu',
      orderIndex: 4,
      subcategories: ['Smart Switches & Plugs', 'IoT Sensors & Detectors', 'Smart Lighting & Strips', 'Home Automation Hubs', 'Microcontroller Dev Boards']
    },
    {
      name: 'Electronics & Troubleshooting Lab',
      slug: 'electronics-and-troubleshooting',
      description: 'Power backup systems, precision diagnostic instruments, soldering stations, electronic components, and replacement boards.',
      icon: 'Wrench',
      orderIndex: 5,
      subcategories: ['UPS & Inverters', 'Diagnostic & Multimeter Tools', 'Power Adapters & Chargers', 'Electronic Components', 'Soldering & Repair Kits']
    },
    {
      name: 'Office & Order Supplies',
      slug: 'office-and-order-supplies',
      description: 'Printers, thermal receipt paper, toners, barcode scanners, and bulk commercial electronics supply.',
      icon: 'Printer',
      orderIndex: 6,
      subcategories: ['Printers & Scanners', 'Toners & Ink', 'Thermal Paper & Cash Registers', 'Barcode Scanners', 'Office Peripherals']
    }
  ];

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        orderIndex: cat.orderIndex,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        orderIndex: cat.orderIndex,
        isActive: true,
      },
    });

    for (const subName of cat.subcategories) {
      const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await prisma.subcategory.upsert({
        where: { slug: subSlug },
        update: {
          name: subName,
          categoryId: createdCat.id,
        },
        create: {
          name: subName,
          slug: subSlug,
          categoryId: createdCat.id,
        },
      });
    }
  }
  console.log('✓ Categories and subcategories seeded');

  // 4. Brands
  const brands = [
    { name: 'TP-Link', slug: 'tp-link', isPopular: true },
    { name: 'MikroTik', slug: 'mikrotik', isPopular: true },
    { name: 'Ubiquiti', slug: 'ubiquiti', isPopular: true },
    { name: 'Hikvision', slug: 'hikvision', isPopular: true },
    { name: 'Dahua', slug: 'dahua', isPopular: true },
    { name: 'Dell', slug: 'dell', isPopular: true },
    { name: 'HP', slug: 'hp', isPopular: true },
    { name: 'Lenovo', slug: 'lenovo', isPopular: true },
    { name: 'Asus', slug: 'asus', isPopular: true },
    { name: 'Sonoff', slug: 'sonoff', isPopular: true },
    { name: 'Tuya Smart', slug: 'tuya-smart', isPopular: true },
    { name: 'D-Link', slug: 'd-link', isPopular: false },
    { name: 'Epson', slug: 'epson', isPopular: true },
    { name: 'APC', slug: 'apc', isPopular: true },
  ];

  for (const b of brands) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, isPopular: b.isPopular },
      create: { name: b.name, slug: b.slug, isPopular: b.isPopular },
    });
  }
  console.log('✓ Brands seeded');

  // 5. Professional Services
  const services = [
    {
      title: 'Computer & Laptop Chip-Level Repair',
      slug: 'computer-laptop-repair',
      icon: 'Laptop',
      shortDescription: 'Expert hardware diagnosis, motherboard repair, broken screen replacement, liquid damage recovery, and OS re-installation.',
      fullDescription: 'Our certified technicians provide comprehensive chip-level repairs for all laptop and desktop brands (Dell, HP, Lenovo, Asus, Acer, Apple). We handle power rail short circuits, BIOS reprogramming, thermal re-pasting, hinge rebuilding, NVMe SSD upgrades, and data recovery.',
      features: JSON.stringify([
        'Motherboard chip-level diagnostics & micro-soldering',
        'Display replacement (FHD/OLED/IPS panels)',
        'Battery replacement & charging port rebuilding',
        'Clean OS installation, driver tuning & virus removal',
        'Physical liquid damage remediation with ultrasonic cleaning'
      ]),
      pricingNote: 'Free initial inspection & quotation. Basic service starting from रु 500.',
      startingPrice: 500,
      isFeatured: true,
      orderIndex: 1,
    },
    {
      title: 'Networking Installation & Structured Cabling',
      slug: 'networking-installation-maintenance',
      icon: 'Network',
      shortDescription: 'Enterprise and SMB local area network (LAN) setup, Cat6/Fiber optic structured cabling, rack dressing, and testing.',
      fullDescription: 'We design and deploy robust, high-availability wired and wireless network infrastructure for corporate offices, schools, hospitals, hotels, and government institutions across Surkhet and Karnali. Includes patch panel termination, server rack installation, cable testing, and network diagrams.',
      features: JSON.stringify([
        'Cat6/Cat6A & Optical Fiber structured cabling',
        'Server rack mounting, cable management & patch panel punch-down',
        'Gigabit managed switch configuration & 802.1Q VLAN separation',
        'Fluke network testing & end-to-end cable certification',
        'Clean documentation and port labelling'
      ]),
      pricingNote: 'Custom quote based on site survey, cable length, and node count.',
      startingPrice: 2500,
      isFeatured: true,
      orderIndex: 2,
    },
    {
      title: 'Router, Switch & High-Speed Wi-Fi Solutions',
      slug: 'router-switch-wifi-solutions',
      icon: 'Wifi',
      shortDescription: 'Dual-band Wi-Fi 6 mesh deployments, long-range point-to-point wireless bridges, MikroTik routing, and bandwidth management.',
      fullDescription: 'Eliminate dead zones with enterprise-grade wireless access points and seamless mesh roaming. We configure MikroTik, Ubiquiti UniFi, and TP-Link Omada architectures with captive portals, dual-WAN failover, bandwidth limits, and secure staff/guest networks.',
      features: JSON.stringify([
        'Seamless multi-AP roaming without signal drops',
        'Dual-WAN load balancing & automatic internet failover',
        'Bandwidth throttling & user quota management (MikroTik RouterOS)',
        'Guest Wi-Fi hotspot with voucher authentication',
        'Point-to-Point (PtP) wireless links up to 10+ km'
      ]),
      pricingNote: 'Site survey available across Surkhet Valley.',
      startingPrice: 1500,
      isFeatured: true,
      orderIndex: 3,
    },
    {
      title: 'CCTV & Security Surveillance Installation',
      slug: 'cctv-surveillance-installation',
      icon: 'Video',
      shortDescription: 'Professional IP & HD camera system deployment with remote mobile viewing, night vision, and tamper-resistant storage.',
      fullDescription: 'Complete electronic security solutions for residential, commercial, and warehouse properties. We install authorized Hikvision and Dahua IP cameras with ColorVu night vision, Smart AI motion detection, NVR video management, and 24/7 smartphone live stream access.',
      features: JSON.stringify([
        'High definition 2MP / 4MP / 4K Ultra HD IP & analog cameras',
        'Full-color night vision and perimeter line-crossing detection',
        'Centralized NVR/DVR storage with continuous backup',
        'Secure mobile app setup for real-time monitoring from anywhere',
        'Hidden conduit wiring and weather-proof outdoor enclosures'
      ]),
      pricingNote: 'Complete packages available from 4-camera setups to 32+ channel systems.',
      startingPrice: 3000,
      isFeatured: true,
      orderIndex: 4,
    },
    {
      title: 'IoT & Smart Home/Office Solutions',
      slug: 'iot-smart-device-solutions',
      icon: 'Cpu',
      shortDescription: 'Automated lighting, smart water tank automation, sensor telemetry, and mobile-controlled appliance scheduling.',
      fullDescription: 'Modernize your living space and commercial building with smart IoT technology. We install Sonoff, Tuya, and Zigbee/Wi-Fi smart relays that allow you to control lights, pumps, air conditioners, and security sensors directly from your smartphone or voice assistants.',
      features: JSON.stringify([
        'Automated water motor controller with overhead tank level sensors',
        'Smart wall switches with manual touch and remote app control',
        'Scheduled appliance timers to lower energy consumption',
        'Power consumption monitoring & voltage protection relays',
        'Temperature and humidity telemetry for server rooms'
      ]),
      pricingNote: 'Modular packages tailored to your house or office layout.',
      startingPrice: 2000,
      isFeatured: true,
      orderIndex: 5,
    },
    {
      title: 'Electronics Repair & Troubleshooting Lab',
      slug: 'electronics-repair-troubleshooting',
      icon: 'Wrench',
      shortDescription: 'Bench testing, power supply refurbishment, inverter/UPS servicing, and specialized board-level troubleshooting.',
      fullDescription: 'Equipped with precision multimeters, oscilloscopes, variable DC power supplies, and hot-air rework stations, our repair lab repairs damaged electronic boards, pure sine wave inverters, sound systems, medical/office electronics, and proprietary power control modules.',
      features: JSON.stringify([
        'Pure sine wave inverter & online UPS repair',
        'Switch-mode power supply (SMPS) component replacement',
        'Capacitor, MOSFET, diode & IC replacement',
        'Short-circuit tracing with thermal imaging inspection',
        'Strict burn-in load testing prior to device handover'
      ]),
      pricingNote: 'Inspection fee waived upon repair approval.',
      startingPrice: 500,
      isFeatured: true,
      orderIndex: 6,
    },
    {
      title: 'Annual Maintenance Contracts (AMC) & Technical Support',
      slug: 'maintenance-contracts-technical-support',
      icon: 'ShieldCheck',
      shortDescription: 'Dedicated IT service level agreements (SLA) for corporate offices, educational institutions, financial cooperatives, and clinics.',
      fullDescription: 'Keep your business running without unexpected downtime. Our AMC plans provide scheduled monthly preventive maintenance, priority on-call troubleshooting, printer servicing, network health audits, data backups, and discounted replacement parts.',
      features: JSON.stringify([
        'Guaranteed response time within 2 to 4 hours in Surkhet Valley',
        'Monthly preventive hardware cleaning & thermal checks',
        'Quarterly software optimization, patches & security audit',
        'Periodic offline & cloud data backup verification',
        'Unlimited emergency troubleshooting visits during business hours'
      ]),
      pricingNote: 'Custom annual contracts scaled to your workstation and device count.',
      startingPrice: 12000,
      isFeatured: true,
      orderIndex: 7,
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        title: s.title,
        icon: s.icon,
        shortDescription: s.shortDescription,
        fullDescription: s.fullDescription,
        features: s.features,
        pricingNote: s.pricingNote,
        startingPrice: s.startingPrice,
        isFeatured: s.isFeatured,
        orderIndex: s.orderIndex,
      },
      create: {
        title: s.title,
        slug: s.slug,
        icon: s.icon,
        shortDescription: s.shortDescription,
        fullDescription: s.fullDescription,
        features: s.features,
        pricingNote: s.pricingNote,
        startingPrice: s.startingPrice,
        isFeatured: s.isFeatured,
        orderIndex: s.orderIndex,
        isActive: true,
      },
    });
  }
  console.log('✓ Services seeded');

  // 6. Featured Products with real specs and NPR pricing
  const netCat = await prisma.category.findUnique({ where: { slug: 'networking-and-connectivity' } });
  const cctvCat = await prisma.category.findUnique({ where: { slug: 'cctv-and-surveillance' } });
  const laptopCat = await prisma.category.findUnique({ where: { slug: 'laptops-and-computers' } });
  const iotCat = await prisma.category.findUnique({ where: { slug: 'iot-and-smart-devices' } });
  
  const tpLink = await prisma.brand.findUnique({ where: { slug: 'tp-link' } });
  const mikrotik = await prisma.brand.findUnique({ where: { slug: 'mikrotik' } });
  const hikvision = await prisma.brand.findUnique({ where: { slug: 'hikvision' } });
  const dell = await prisma.brand.findUnique({ where: { slug: 'dell' } });
  const sonoff = await prisma.brand.findUnique({ where: { slug: 'sonoff' } });

  const products = [
    {
      title: 'TP-Link Archer AX73 AX5400 Dual-Band Gigabit Wi-Fi 6 Router',
      slug: 'tp-link-archer-ax73-wifi6-router',
      sku: 'TPL-AX73-GIG',
      categoryId: netCat.id,
      brandId: tpLink?.id,
      regularPrice: 17500,
      offerPrice: 15800,
      discountPercent: 10,
      stockQuantity: 12,
      stockStatus: 'IN_STOCK',
      shortDescription: 'High-speed Wi-Fi 6 router offering 5400 Mbps bandwidth, 6 high-gain antennas, OFDMA, MU-MIMO, and robust coverage for large homes and offices.',
      fullDescription: 'The TP-Link Archer AX73 brings ultra-fast Wi-Fi 6 speeds to heavy streaming, multiple gaming sessions, and high-density office networks. Powered by a triple-core CPU and equipped with USB 3.0 file sharing, HomeShield security, and VPN client/server capabilities.',
      specifications: JSON.stringify([
        { name: 'Wireless Standards', value: 'IEEE 802.11ax/ac/n/a 5 GHz, IEEE 802.11ax/n/b/g 2.4 GHz' },
        { name: 'Wi-Fi Speeds', value: '5 GHz: 4804 Mbps, 2.4 GHz: 574 Mbps' },
        { name: 'Antennas', value: '6× High-Performance Fixed Antennas with Beamforming' },
        { name: 'Ethernet Ports', value: '1× Gigabit WAN Port, 4× Gigabit LAN Ports' },
        { name: 'USB Sharing', value: '1× USB 3.0 Port supporting Apple Time Machine, Media Server, FTP' },
        { name: 'Security', value: 'WPA3, TP-Link HomeShield, SPI Firewall' }
      ]),
      warranty: '1 Year Official Replacement Warranty',
      isFeatured: true,
      isPopular: true,
      isNewArrival: true,
      primaryImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      title: 'MikroTik hEX RB750Gr3 5-Port Gigabit Router',
      slug: 'mikrotik-hex-rb750gr3-gigabit-router',
      sku: 'MTK-RB750GR3',
      categoryId: netCat.id,
      brandId: mikrotik?.id,
      regularPrice: 9500,
      offerPrice: 8800,
      discountPercent: 7,
      stockQuantity: 18,
      stockStatus: 'IN_STOCK',
      shortDescription: 'Compact, 5-port Gigabit Ethernet router with hardware IPsec encryption, dual-core 880MHz CPU, and powerful RouterOS level 4 license.',
      fullDescription: 'Ideal for small offices, hotels, and ISPs requiring robust bandwidth management, failover, queue trees, and VPN aggregation without wireless overhead. Includes full microSD slot for Dude server package and log files.',
      specifications: JSON.stringify([
        { name: 'CPU', value: 'MT7621A Dual-Core 880 MHz (4 Threads)' },
        { name: 'RAM', value: '256 MB' },
        { name: 'Storage', value: '16 MB Flash + MicroSD Slot' },
        { name: 'Ports', value: '5× 10/100/1000 Gigabit Ethernet Ports' },
        { name: 'Operating System', value: 'RouterOS Level 4' },
        { name: 'Hardware Acceleration', value: 'IPsec hardware acceleration (up to 470 Mbps)' }
      ]),
      warranty: '1 Year Warranty',
      isFeatured: true,
      isPopular: true,
      isNewArrival: false,
      primaryImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      title: 'Hikvision DS-2CD2047G2-LU 4MP ColorVu Fixed Bullet Network Camera',
      slug: 'hikvision-ds-2cd2047g2-lu-4mp-colorvu-camera',
      sku: 'HIK-4MP-COLORVU',
      categoryId: cctvCat.id,
      brandId: hikvision?.id,
      regularPrice: 12500,
      offerPrice: 11200,
      discountPercent: 10,
      stockQuantity: 15,
      stockStatus: 'IN_STOCK',
      shortDescription: '24/7 vivid color imaging with F1.0 advanced lenses, 4 MP resolution, built-in microphone for real-time audio security, and IP67 weather resistance.',
      fullDescription: 'Hikvision ColorVu technology enables cameras to produce full-color videos even in extremely dim environments. Deep-learning based human and vehicle target classification (AcuSense) drastically reduces false alarms.',
      specifications: JSON.stringify([
        { name: 'Resolution', value: '4 MP (2688 × 1520 @ 30 fps)' },
        { name: 'Lens', value: '2.8 mm Fixed Lens, F1.0 Super Aperture' },
        { name: 'Night Vision', value: 'ColorVu 24/7 Color, White Light up to 40m' },
        { name: 'Audio', value: 'Built-in microphone for audio recording' },
        { name: 'Protection', value: 'IP67 Water & Dust Resistance' },
        { name: 'Compression', value: 'H.265+ / H.265 / H.264+ / H.264' }
      ]),
      warranty: '2 Years Manufacturer Warranty',
      isFeatured: true,
      isPopular: true,
      isNewArrival: true,
      primaryImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      title: 'Dell Vostro 3520 15.6" Business Laptop (Intel Core i5 12th Gen / 16GB / 512GB SSD)',
      slug: 'dell-vostro-3520-i5-12th-gen-laptop',
      sku: 'DEL-VOS-3520-I5',
      categoryId: laptopCat.id,
      brandId: dell?.id,
      regularPrice: 78000,
      offerPrice: 72500,
      discountPercent: 7,
      stockQuantity: 6,
      stockStatus: 'IN_STOCK',
      shortDescription: 'Reliable business laptop with 12th Gen Intel Core i5, 120Hz FHD anti-glare display, 16GB DDR4 RAM, and fast NVMe storage for enterprise tasks.',
      fullDescription: 'Engineered for durability and seamless multitasking. Features Dell ComfortView software to reduce harmful blue light, TPM 2.0 security chip, spill-resistant keyboard with numeric keypad, and long battery endurance.',
      specifications: JSON.stringify([
        { name: 'Processor', value: '12th Gen Intel Core i5-1235U (10 Cores, up to 4.40 GHz)' },
        { name: 'RAM', value: '16 GB DDR4 3200MHz (Dual Channel)' },
        { name: 'Storage', value: '512 GB M.2 PCIe NVMe Solid State Drive' },
        { name: 'Display', value: '15.6" FHD (1920 x 1080) 120Hz, Anti-glare, Narrow Border' },
        { name: 'Graphics', value: 'Intel Iris Xe Graphics' },
        { name: 'Weight', value: '1.66 kg' }
      ]),
      warranty: '1 Year Authorized Dell Warranty + Service Support',
      isFeatured: true,
      isPopular: true,
      isNewArrival: false,
      primaryImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      title: 'Sonoff POW Elite 20A Smart Power Metering Relay Switch with LCD Screen',
      slug: 'sonoff-pow-elite-20a-smart-switch',
      sku: 'SON-POWR320D',
      categoryId: iotCat.id,
      brandId: sonoff?.id,
      regularPrice: 3800,
      offerPrice: 3300,
      discountPercent: 13,
      stockQuantity: 25,
      stockStatus: 'IN_STOCK',
      shortDescription: 'High-current 20A smart Wi-Fi switch that tracks real-time power, current, voltage, and historical electricity consumption on an integrated LCD screen.',
      fullDescription: 'Monitor power consumption of water heaters, air conditioners, pumps, and heavy appliances. Features overload protection that trips automatically if threshold is breached, 6-month historical consumption charts on eWeLink app, and local LAN control.',
      specifications: JSON.stringify([
        { name: 'Input/Output', value: '100-240V ~ 50/60Hz 20A Max' },
        { name: 'Screen', value: 'LCD display showing current, voltage, active power' },
        { name: 'Connectivity', value: 'Wi-Fi IEEE 802.11 b/g/n 2.4GHz' },
        { name: 'Safety', value: 'V-0 flame-retardant PC enclosure, overload protection' },
        { name: 'App Control', value: 'eWeLink (Android & iOS), Home Assistant compatible' }
      ]),
      warranty: '6 Months Replacement Warranty',
      isFeatured: true,
      isPopular: true,
      isNewArrival: true,
      primaryImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        sku: p.sku,
        regularPrice: p.regularPrice,
        offerPrice: p.offerPrice,
        discountPercent: p.discountPercent,
        stockQuantity: p.stockQuantity,
        stockStatus: p.stockStatus,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        specifications: p.specifications,
        warranty: p.warranty,
        isFeatured: p.isFeatured,
        isPopular: p.isPopular,
        isNewArrival: p.isNewArrival,
        primaryImage: p.primaryImage,
        status: p.status,
      },
      create: {
        ...p,
      },
    });
  }
  console.log('✓ Products seeded');

  // 7. Promotional Banners
  const banners = [
    {
      title: 'Smart Tech & Networking Festival 2026',
      subtitle: 'Upgrade your home & business network with gigabit Wi-Fi 6 and smart IoT controls.',
      badgeText: 'Surkhet Special',
      ctaText: 'Explore Offers',
      ctaLink: '/products',
      position: 'HERO_SLIDER',
      imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=80',
      discountPercent: 15,
      isApproved: true,
      status: 'PUBLISHED',
      orderIndex: 1,
    },
    {
      title: 'Expert Chip-Level Laptop Repair in Surkhet',
      subtitle: 'Free preliminary inspection, quick turnaround, and warranty on all motherboard fixes.',
      badgeText: 'Professional Lab',
      ctaText: 'Book Service',
      ctaLink: '/services',
      position: 'HERO_SLIDER',
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1600&q=80',
      isApproved: true,
      status: 'PUBLISHED',
      orderIndex: 2,
    },
  ];

  for (const b of banners) {
    await prisma.banner.create({
      data: b,
    });
  }
  console.log('✓ Promotional banners seeded');

  // 8. Helpful FAQs
  const faqs = [
    {
      question: 'Where is Krishna Electronics located in Surkhet?',
      answer: 'Our main store and technical repair laboratory is situated at Birendranagar-6, Buddhapath, Surkhet, Nepal. You can visit us during business hours from Sunday to Friday.',
      category: 'Store & Location',
      orderIndex: 1,
    },
    {
      question: 'Do you deliver electronics and equipment outside Surkhet Valley?',
      answer: 'Yes! We offer direct same-day/next-day local delivery across the Surkhet Valley and dispatch verified orders to Dailekh, Jajarkot, Jumla, Kalikot, Salyan, and across Karnali Province via reliable transport networks.',
      category: 'Shipping & Delivery',
      orderIndex: 2,
    },
    {
      question: 'Do you provide on-site CCTV and Wi-Fi installation services?',
      answer: 'Yes. Our experienced networking and surveillance engineers carry out site surveys, structured cabling, camera mounting, router configuration, and mobile app setup directly at your home, office, school, or business facility.',
      category: 'Services',
      orderIndex: 3,
    },
    {
      question: 'What warranty is offered on electronics and repairs?',
      answer: 'All brand-new laptops, networking hardware, and CCTV systems carry official manufacturer warranties (typically 1 to 2 years). Hardware repairs conducted in our laboratory come with dedicated service warranties.',
      category: 'Warranty & Repairs',
      orderIndex: 4,
    },
    {
      question: 'How do Annual Maintenance Contracts (AMC) work for offices?',
      answer: 'Under our AMC agreements, we perform monthly scheduled hardware cleanings, network optimization, preventative checkups, and provide priority on-call troubleshooting whenever any computer, printer, or network device faces issues.',
      category: 'Enterprise AMC',
      orderIndex: 5,
    },
  ];

  for (const f of faqs) {
    await prisma.fAQ.create({
      data: f,
    });
  }
  console.log('✓ FAQs seeded');

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
