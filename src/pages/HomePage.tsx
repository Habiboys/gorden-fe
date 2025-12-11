import { Hero } from '../components/Hero';
import { ProductCategories } from '../components/ProductCategories';
import { PromoBanner } from '../components/PromoBanner';
import { TopProducts } from '../components/TopProducts';
import { CategorySliders } from '../components/CategorySliders';
import { Services } from '../components/Services';
import { Gallery } from '../components/Gallery';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { FAQ } from '../components/FAQ';

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductCategories />
      <PromoBanner />
      <TopProducts />
      <CategorySliders />
      <Services />
      <Gallery />
      <WhyChooseUs />
      <FAQ />
    </>
  );
}