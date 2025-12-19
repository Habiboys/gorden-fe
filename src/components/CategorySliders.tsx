import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  badge?: string;
  category: string;
}

const allProducts: Product[] = [
  // Gorden Smokering
  {
    id: 1,
    name: 'Gorden Smokering Premium',
    price: 'Rp 450.000',
    originalPrice: 'Rp 650.000',
    discount: '30%',
    image: 'https://images.unsplash.com/photo-1754611362309-71297e9f42fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjdXJ0YWlucyUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzY1MDc5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Best Seller',
    category: 'Gorden Custom Smokering',
  },
  {
    id: 2,
    name: 'Smokering Blackout Luxury',
    price: 'Rp 520.000',
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Gorden Custom Smokering',
  },
  {
    id: 3,
    name: 'Smokering Velvet Mewah',
    price: 'Rp 580.000',
    image: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJhcGVzJTIwZmFicmljfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Custom Smokering',
  },
  {
    id: 4,
    name: 'Smokering Linen Natural',
    price: 'Rp 480.000',
    originalPrice: 'Rp 600.000',
    discount: '20%',
    image: 'https://images.unsplash.com/photo-1763718094072-239b21e9dc20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwd2luZG93JTIwdHJlYXRtZW50fGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Custom Smokering',
  },
  {
    id: 5,
    name: 'Smokering Jacquard Elegant',
    price: 'Rp 620.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1754611362309-71297e9f42fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjdXJ0YWlucyUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzY1MDc5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Custom Smokering',
  },
  {
    id: 6,
    name: 'Smokering Satin Glossy',
    price: 'Rp 550.000',
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Custom Smokering',
  },

  // Gorden Kupu-kupu
  {
    id: 7,
    name: 'Gorden Kupu-Kupu Elegan',
    price: 'Rp 380.000',
    originalPrice: 'Rp 500.000',
    discount: '24%',
    image: 'https://images.unsplash.com/photo-1621215052063-6ed29c948b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGJlZHJvb218ZW58MXx8fHwxNzY1MDc5ODkwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Best Seller',
    category: 'Gorden Custom Kupu-kupu',
  },
  {
    id: 8,
    name: 'Kupu-kupu Sheer Minimalis',
    price: 'Rp 320.000',
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Gorden Custom Kupu-kupu',
  },
  {
    id: 9,
    name: 'Kupu-kupu Blackout Premium',
    price: 'Rp 420.000',
    image: 'https://images.unsplash.com/photo-1621215052063-6ed29c948b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGJlZHJvb218ZW58MXx8fHwxNzY1MDc5ODkwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Custom Kupu-kupu',
  },
  {
    id: 10,
    name: 'Kupu-kupu Velvet Mewah',
    price: 'Rp 480.000',
    originalPrice: 'Rp 620.000',
    discount: '23%',
    image: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJhcGVzJTIwZmFicmljfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Custom Kupu-kupu',
  },
  {
    id: 11,
    name: 'Kupu-kupu Linen Natural',
    price: 'Rp 360.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1763718094072-239b21e9dc20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwd2luZG93JTIwdHJlYXRtZW50fGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Custom Kupu-kupu',
  },
  {
    id: 12,
    name: 'Kupu-kupu Embroidery',
    price: 'Rp 520.000',
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Custom Kupu-kupu',
  },

  // Zebra Blind
  {
    id: 13,
    name: 'Zebra Blind Minimalis',
    price: 'Rp 380.000',
    originalPrice: 'Rp 480.000',
    discount: '21%',
    image: 'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Best Seller',
    category: 'Blinds',
  },
  {
    id: 14,
    name: 'Zebra Blind Premium',
    price: 'Rp 420.000',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Blinds',
  },
  {
    id: 15,
    name: 'Zebra Blind Blackout',
    price: 'Rp 450.000',
    image: 'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 16,
    name: 'Zebra Blind Deluxe',
    price: 'Rp 480.000',
    originalPrice: 'Rp 600.000',
    discount: '20%',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 17,
    name: 'Zebra Blind Dimout',
    price: 'Rp 400.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBibGluZHMlMjBtb2Rlcm58ZW58MXx8fHwxNzY1MDg1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 18,
    name: 'Zebra Blind Custom',
    price: 'Rp 500.000',
    image: 'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },

  // Wooden Blind -> Blinds
  {
    id: 19,
    name: 'Wooden Blind Natural',
    price: 'Rp 450.000',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 20,
    name: 'Wooden Blind Premium',
    price: 'Rp 520.000',
    originalPrice: 'Rp 680.000',
    discount: '24%',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBibGluZHMlMjBtb2Rlcm58ZW58MXx8fHwxNzY1MDg1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Blinds',
  },
  {
    id: 21,
    name: 'Wooden Blind Dark Oak',
    price: 'Rp 480.000',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 22,
    name: 'Wooden Blind White Wash',
    price: 'Rp 460.000',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBibGluZHMlMjBtb2Rlcm58ZW58MXx8fHwxNzY1MDg1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 23,
    name: 'Wooden Blind Mahogany',
    price: 'Rp 550.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 24,
    name: 'Wooden Blind Bamboo',
    price: 'Rp 420.000',
    originalPrice: 'Rp 550.000',
    discount: '24%',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBibGluZHMlMjBtb2Rlcm58ZW58MXx8fHwxNzY1MDg1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },

  // Roller Blind -> Blinds
  {
    id: 25,
    name: 'Roller Blind Premium',
    price: 'Rp 280.000',
    originalPrice: 'Rp 400.000',
    discount: '30%',
    image: 'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Best Seller',
    category: 'Blinds',
  },
  {
    id: 26,
    name: 'Roller Blind Blackout',
    price: 'Rp 320.000',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Blinds',
  },
  {
    id: 27,
    name: 'Roller Blind Dimout',
    price: 'Rp 300.000',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBibGluZHMlMjBtb2Rlcm58ZW58MXx8fHwxNzY1MDg1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 28,
    name: 'Roller Blind Sunscreen',
    price: 'Rp 350.000',
    originalPrice: 'Rp 450.000',
    discount: '22%',
    image: 'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 29,
    name: 'Roller Blind Custom',
    price: 'Rp 380.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 30,
    name: 'Roller Blind Solar',
    price: 'Rp 340.000',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBibGluZHMlMjBtb2Rlcm58ZW58MXx8fHwxNzY1MDg1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },

  // Vertical Blind -> Blinds
  {
    id: 31,
    name: 'Vertical Blind Modern',
    price: 'Rp 320.000',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 32,
    name: 'Vertical Blind Premium',
    price: 'Rp 380.000',
    originalPrice: 'Rp 500.000',
    discount: '24%',
    image: 'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Blinds',
  },
  {
    id: 33,
    name: 'Vertical Blind Blackout',
    price: 'Rp 400.000',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 34,
    name: 'Vertical Blind Dimout',
    price: 'Rp 350.000',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBibGluZHMlMjBtb2Rlcm58ZW58MXx8fHwxNzY1MDg1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 35,
    name: 'Vertical Blind PVC',
    price: 'Rp 290.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },
  {
    id: 36,
    name: 'Vertical Blind Fabric',
    price: 'Rp 420.000',
    originalPrice: 'Rp 550.000',
    discount: '24%',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Blinds',
  },

  // Wallpaper -> Produk Other
  {
    id: 37,
    name: 'Wallpaper Premium',
    price: 'Rp 180.000',
    originalPrice: 'Rp 250.000',
    discount: '28%',
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Best Seller',
    category: 'Produk Other',
  },
  {
    id: 38,
    name: 'Wallpaper 3D Modern',
    price: 'Rp 220.000',
    image: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJhcGVzJTIwZmFicmljfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Produk Other',
  },
  {
    id: 39,
    name: 'Wallpaper Vinyl',
    price: 'Rp 150.000',
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 40,
    name: 'Wallpaper Minimalis',
    price: 'Rp 200.000',
    originalPrice: 'Rp 280.000',
    discount: '29%',
    image: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJhcGVzJTIwZmFicmljfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 41,
    name: 'Wallpaper Luxury',
    price: 'Rp 280.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 42,
    name: 'Wallpaper Tekstur',
    price: 'Rp 190.000',
    image: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJhcGVzJTIwZmFicmljfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },

  // Lantai Vynil -> Produk Other
  {
    id: 43,
    name: 'Lantai Vynil Premium',
    price: 'Rp 350.000',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjYXJwZXQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4OTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 44,
    name: 'Lantai Vynil Wood',
    price: 'Rp 420.000',
    originalPrice: 'Rp 550.000',
    discount: '24%',
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Produk Other',
  },
  {
    id: 45,
    name: 'Lantai Vynil Stone',
    price: 'Rp 380.000',
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjYXJwZXQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4OTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 46,
    name: 'Lantai Vynil Minimalis',
    price: 'Rp 320.000',
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 47,
    name: 'Lantai Vynil Luxury',
    price: 'Rp 480.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjYXJwZXQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4OTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 48,
    name: 'Lantai Vynil Anti Slip',
    price: 'Rp 400.000',
    originalPrice: 'Rp 520.000',
    discount: '23%',
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },

  // Jipproll -> Produk Other
  {
    id: 49,
    name: 'Jipproll Premium',
    price: 'Rp 120.000',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1763939919676-97187d9f4db0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY3VydGFpbnMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 50,
    name: 'Jipproll Transparent',
    price: 'Rp 100.000',
    originalPrice: 'Rp 150.000',
    discount: '33%',
    image: 'https://images.unsplash.com/photo-1763718094072-239b21e9dc20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwd2luZG93JTIwdHJlYXRtZW50fGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Produk Other',
  },
  {
    id: 51,
    name: 'Jipproll Blackout',
    price: 'Rp 140.000',
    image: 'https://images.unsplash.com/photo-1763939919676-97187d9f4db0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY3VydGFpbnMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 52,
    name: 'Jipproll PVC',
    price: 'Rp 110.000',
    image: 'https://images.unsplash.com/photo-1763718094072-239b21e9dc20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwd2luZG93JTIwdHJlYXRtZW50fGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 53,
    name: 'Jipproll Custom',
    price: 'Rp 150.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1763939919676-97187d9f4db0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY3VydGFpbnMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 54,
    name: 'Jipproll Economy',
    price: 'Rp 85.000',
    originalPrice: 'Rp 120.000',
    discount: '29%',
    image: 'https://images.unsplash.com/photo-1763718094072-239b21e9dc20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwd2luZG93JTIwdHJlYXRtZW50fGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },

  // Outdoor -> Produk Other
  {
    id: 55,
    name: 'Outdoor Blind Premium',
    price: 'Rp 580.000',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 56,
    name: 'Outdoor Roller Blind',
    price: 'Rp 520.000',
    originalPrice: 'Rp 680.000',
    discount: '24%',
    image: 'https://images.unsplash.com/photo-1754611362309-71297e9f42fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjdXJ0YWlucyUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzY1MDc5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
    category: 'Produk Other',
  },
  {
    id: 57,
    name: 'Outdoor Awning',
    price: 'Rp 650.000',
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 58,
    name: 'Outdoor Canopy',
    price: 'Rp 720.000',
    image: 'https://images.unsplash.com/photo-1754611362309-71297e9f42fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjdXJ0YWlucyUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzY1MDc5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 59,
    name: 'Outdoor Sunshade',
    price: 'Rp 480.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
  {
    id: 60,
    name: 'Outdoor Pergola Blind',
    price: 'Rp 800.000',
    originalPrice: 'Rp 1.000.000',
    discount: '20%',
    image: 'https://images.unsplash.com/photo-1754611362309-71297e9f42fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjdXJ0YWlucyUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzY1MDc5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Produk Other',
  },
];

interface CategorySliderProps {
  category: string;
  title: string;
  badge: string;
}

function CategorySlider({ category, title, badge }: CategorySliderProps) {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBtnId, setHoveredBtnId] = useState<string | null>(null);

  // Fetch products by category
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log(`🔄 Fetching products for category: ${category}`);
        const response = await productsApi.getAll({ category, limit: 10 });
        console.log(`✅ Products fetched for ${category}:`, response);
        setProducts(response.data || []);
      } catch (error) {
        console.error(`❌ Error fetching products for ${category}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });

      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section className="py-6 lg:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#EB216A]/10 text-[#EB216A] px-3 py-1.5 rounded-full mb-3">
              <span className="text-xs">{badge}</span>
            </div>
            <h2 className="text-3xl text-gray-900">{title}</h2>
          </div>

          {/* Navigation Arrows - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              variant="outline"
              size="icon"
              className="rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              variant="outline"
              size="icon"
              className="rounded-full disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/products')}
              variant="outline"
              className="ml-2"
            >
              Lihat Semua
            </Button>
          </div>
        </div>

        {/* Slider */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-2 lg:gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative flex-shrink-0 w-[calc(50%-4px)] lg:w-[calc(20%-9.6px)]"
            >
              {/* Card Container */}
              <div className="relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={getProductImageUrl(product.images || product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badge */}
                  {(product.badge || product.bestSeller || product.newArrival || product.featured) && (
                    <Badge className="absolute top-3 left-3 bg-[#EB216A] text-white border-0 shadow-lg text-xs">
                      {product.badge || (product.bestSeller ? 'Best Seller' : product.newArrival ? 'New' : 'Featured')}
                    </Badge>
                  )}

                  {/* Wishlist Button */}
                  <button className="absolute top-3 right-3 w-8 h-8 lg:w-10 lg:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#EB216A] hover:text-white shadow-lg">
                    <Heart className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>

                  {/* Quick View Button - Shows on Hover */}
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <button
                      className="w-full shadow-xl text-xs lg:text-sm rounded-md py-2 px-3 font-medium flex items-center justify-center gap-1 lg:gap-2 transition-all"
                      style={{
                        backgroundColor: hoveredBtnId === product.id ? '#EB216A' : 'white',
                        color: hoveredBtnId === product.id ? 'white' : '#EB216A'
                      }}
                      onMouseEnter={() => setHoveredBtnId(product.id)}
                      onMouseLeave={() => setHoveredBtnId(null)}
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <ShoppingCart className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span className="hidden lg:inline">Lihat Detail</span>
                      <span className="lg:hidden">Detail</span>
                    </button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-3 lg:p-4 flex flex-col flex-grow">
                  <h3 className="text-sm lg:text-base text-gray-900 mb-2 lg:mb-3 group-hover:text-[#EB216A] transition-colors line-clamp-2 min-h-[40px] lg:min-h-[48px]">
                    {product.name}
                  </h3>

                  {/* Price Section */}
                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col gap-0.5 lg:gap-1">
                      {product.comparePrice ? (
                        <>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <span className="text-xs text-gray-400 line-through">
                              Rp {typeof product.comparePrice === 'number' ? product.comparePrice.toLocaleString('id-ID') : product.comparePrice}
                            </span>
                            <span className="text-[10px] lg:text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                              -{product.discount || Math.round((1 - product.price / product.comparePrice) * 100)}%
                            </span>
                          </div>
                          <span className="text-base lg:text-xl text-[#EB216A]">
                            Rp {typeof product.price === 'number' ? product.price.toLocaleString('id-ID') : product.price}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="h-4 lg:h-5" />
                          <span className="text-base lg:text-xl text-[#EB216A]">
                            Rp {typeof product.price === 'number' ? product.price.toLocaleString('id-ID') : product.price}
                          </span>
                        </>
                      )}
                      <span className="text-[10px] lg:text-xs text-gray-500">
                        Per meter
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-[#EB216A] transition-colors lg:hidden">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="lg:hidden mt-6 text-center">
          <Button
            onClick={() => navigate('/products')}
            variant="outline"
            className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white"
          >
            Lihat Semua {title}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function CategorySliders() {
  return (
    <>
      <CategorySlider
        category="Blinds"
        title="Blinds"
        badge="Modern Design"
      />
      <CategorySlider
        category="Gorden Custom Smokering"
        title="Gorden Custom Smokering"
        badge="Custom Made"
      />
      <CategorySlider
        category="Gorden Custom Kupu-kupu"
        title="Gorden Custom Kupu-kupu"
        badge="Elegant Style"
      />
      <CategorySlider
        category="Produk Other"
        title="Produk Other"
        badge="Pilihan Lengkap"
      />
    </>
  );
}