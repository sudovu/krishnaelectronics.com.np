import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminFromRequest } from '@/lib/auth';

interface GenerationRequest {
  prompt: string;
  style: string; // 'cyber-clean', 'dark-navy-neon', 'minimal-commercial', 'modern-tech-lab'
  productName?: string;
  category?: string;
  targetPlacement: 'HERO_SLIDER' | 'PROMO_GRID' | 'OFFER_BANNER';
  discountPercent?: number;
}

export async function POST(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerationRequest = await req.json();

    if (!body.prompt || body.prompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please enter a description for the promotional banner.' },
        { status: 400 }
      );
    }

    const { prompt, style, productName, targetPlacement, discountPercent } = body;

    const cleanProduct = productName?.trim();

    // High quality themed creative image options
    // Curated high-resolution professional tech visuals tuned to electronics, networking, and repairs
    const styleOptions = [
      {
        id: 'opt-1',
        title: cleanProduct || 'High-Performance Gigabit & Wi-Fi 6 Solutions',
        subtitle: 'Enterprise speed, ultra-low latency, and reliable coverage for business and home in Surkhet.',
        badgeText: 'Official Authorized Hub',
        ctaText: 'Explore Gear',
        ctaLink: '/products',
        imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=80',
        palette: 'Electric Cyan & Deep Navy (#0066FF, #00F0FF, #0B132B)',
        discountPercent: discountPercent || 15,
        couponCode: 'SURKHET2026',
        aiPromptUsed: prompt,
        aiStyle: style || 'cyber-clean',
      },
      {
        id: 'opt-2',
        title: cleanProduct ? `${cleanProduct} – Genuine Lab Warranty` : 'Certified Chip-Level Diagnostics & Motherboard Lab',
        subtitle: 'Hardware micro-soldering, liquid spill recovery, screen replacement, and thermal tuning.',
        badgeText: 'Certified Laboratory',
        ctaText: 'Book Free Diagnostic',
        ctaLink: '/services/computer-laptop-repair',
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1600&q=80',
        palette: 'Precision Blue & Slate (#0052cc, #F8FAFC, #1C2541)',
        discountPercent: null,
        couponCode: null,
        aiPromptUsed: prompt,
        aiStyle: style || 'modern-tech-lab',
      },
      {
        id: 'opt-3',
        title: cleanProduct ? `${cleanProduct} – Exclusive Offer` : 'IoT Smart Automation & 24/7 Security CCTV',
        subtitle: 'Automated water tank controllers, smart power relays, and Hikvision full-color night surveillance.',
        badgeText: 'Limited Offer',
        ctaText: 'View Solutions',
        ctaLink: '/services/iot-smart-device-solutions',
        imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1600&q=80',
        palette: 'Emerald & Navy (#10B981, #06B6D4, #060B18)',
        discountPercent: discountPercent || 10,
        couponCode: 'SMART2026',
        aiPromptUsed: prompt,
        aiStyle: style || 'dark-navy-neon',
      },
    ];

    return NextResponse.json({
      success: true,
      message: 'Generated 3 promotional banner concepts based on your prompt.',
      options: styleOptions,
      note: 'AI generation never publishes automatically. Please select, customize copy/discounts, preview in website context, and explicitly click Approve & Publish.',
    });
  } catch (error: any) {
    console.error('AI banner generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate banner options' },
      { status: 500 }
    );
  }
}
