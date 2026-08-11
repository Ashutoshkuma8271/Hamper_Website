import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Minus, PackagePlus, Plus, Sparkles } from 'lucide-react';
import { useCart, formatPrice } from '@/cart';

const boxes = [
  { name: 'Classic Wicker Basket', price: 599 },
  { name: 'Plum Keepsake Box', price: 749 },
  { name: 'Wooden Keepsake Trunk', price: 1299 },
  { name: 'Eco Kraft Crate', price: 399 },
];
const extras = [
  { name: 'Artisan chocolate bar', price: 280 }, { name: 'Hand-poured candle', price: 450 },
  { name: 'Floral tea blend', price: 320 }, { name: 'Ceramic keepsake mug', price: 390 },
];
const steps = ['Gift box', 'Add items', 'Photo', 'Message', 'Wrapping', 'Delivery', 'Preview'];

export default function BuildYourOwnPage() {
  const { add } = useCart();
  const [step, setStep] = useState(0);
  const [box, setBox] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [wrapping, setWrapping] = useState('Champagne satin ribbon');
  const [delivery, setDelivery] = useState('Standard delivery');
  const [added, setAdded] = useState(false);
  const total = useMemo(() => boxes[box].price + extras.filter((item) => selected.includes(item.name)).reduce((sum, item) => sum + item.price, 0), [box, selected]);
  const toggleExtra = (name: string) => setSelected((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);

  function addToCart() {
    add({ id: 'custom-hamper', slug: `custom-hamper-${Date.now()}`, name: 'Your Custom Hamper', category: 'custom', price: total, image: photo || 'https://images.pexels.com/photos/6690454/pexels-photo-6690454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', description: `${boxes[box].name} with ${selected.length} selected items`, tag: 'Made for you' });
    setAdded(true);
  }

  return <div className="min-h-screen pb-20 pt-16">
    <header className="border-b border-cream-200 bg-cream-100/50 px-5 py-14 dark:border-gray-800 dark:bg-gray-900 sm:px-8"><div className="mx-auto max-w-7xl"><p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">Personalisation studio</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-wine-800 sm:text-5xl dark:text-white">Build your own hamper</h1><p className="mt-3 max-w-2xl text-ink-700/65 dark:text-gray-300">Seven quick steps. Change anything before you add it to your cart.</p></div></header>
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <ol className="flex flex-wrap gap-2">{steps.map((label, index) => <li key={label}><button onClick={() => setStep(index)} className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${index === step ? 'border-wine-600 bg-wine-600 text-cream-50' : index < step ? 'border-gold-400 bg-gold-500/10 text-wine-700 dark:text-gold-300' : 'border-cream-300 text-ink-700/60 hover:border-gold-400 dark:border-gray-700 dark:text-gray-300'}`}>{index < step && <Check className="mr-1 inline h-3 w-3" />}{label}</button></li>)}</ol>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-3xl bg-cream-50 p-6 ring-1 ring-cream-200 sm:p-8 dark:bg-gray-800 dark:ring-gray-700">
          {step === 0 && <ChoiceStep title="Select a gift box or basket" options={boxes.map((item) => ({ label: item.name, detail: formatPrice(item.price) }))} selected={box} onSelect={setBox} />}
          {step === 1 && <div><h2 className="font-display text-2xl font-semibold text-wine-700 dark:text-white">Choose thoughtful extras</h2><p className="mt-2 text-sm text-ink-700/60 dark:text-gray-300">Select as many items as you would like to include.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{extras.map((item) => <button key={item.name} onClick={() => toggleExtra(item.name)} className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm transition-colors ${selected.includes(item.name) ? 'border-wine-600 bg-wine-600/5' : 'border-cream-300 hover:border-gold-400 dark:border-gray-700'}`}><span>{item.name}</span><span className="flex items-center gap-2 text-wine-700 dark:text-gold-300">{selected.includes(item.name) ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{formatPrice(item.price)}</span></button>)}</div></div>}
          {step === 2 && <div><h2 className="font-display text-2xl font-semibold text-wine-700 dark:text-white">Add a photo</h2><p className="mt-2 text-sm text-ink-700/60 dark:text-gray-300">Upload a favourite photo for the keepsake card.</p><label className="mt-6 grid min-h-48 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-cream-300 bg-cream-100/40 p-6 text-center hover:border-gold-500 dark:border-gray-700 dark:bg-gray-900"><input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPhoto(URL.createObjectURL(file)); }} />{photo ? <img src={photo} alt="Gift card preview" className="h-40 rounded-xl object-cover" /> : <><ImagePlus className="h-7 w-7 text-gold-600" /><span className="mt-3 text-sm font-medium">Choose a photo</span><span className="mt-1 text-xs text-ink-700/55">JPG or PNG, up to 5 MB</span></>}</label></div>}
          {step === 3 && <div><h2 className="font-display text-2xl font-semibold text-wine-700 dark:text-white">Write your message</h2><p className="mt-2 text-sm text-ink-700/60 dark:text-gray-300">We will print it on a beautiful gift card.</p><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={240} rows={7} className="input mt-6 resize-none" placeholder="Write something from the heart..." /><p className="mt-2 text-right text-xs text-ink-700/50">{message.length}/240</p></div>}
          {step === 4 && <ChoiceStep title="Choose your wrapping" options={[{ label: 'Champagne satin ribbon', detail: 'Free' }, { label: 'Burgundy velvet ribbon', detail: '+ ₹80' }, { label: 'Natural jute bow', detail: 'Free' }]} selected={['Champagne satin ribbon', 'Burgundy velvet ribbon', 'Natural jute bow'].indexOf(wrapping)} onSelect={(index) => setWrapping(['Champagne satin ribbon', 'Burgundy velvet ribbon', 'Natural jute bow'][index])} />}
          {step === 5 && <ChoiceStep title="Pick a delivery option" options={[{ label: 'Standard delivery', detail: '3–5 days' }, { label: 'Express delivery', detail: '1–2 days' }, { label: 'Schedule a date', detail: 'Choose at checkout' }]} selected={['Standard delivery', 'Express delivery', 'Schedule a date'].indexOf(delivery)} onSelect={(index) => setDelivery(['Standard delivery', 'Express delivery', 'Schedule a date'][index])} />}
          {step === 6 && <div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-gold-500/15 text-gold-600"><Sparkles className="h-5 w-5" /></span><div><h2 className="font-display text-2xl font-semibold text-wine-700 dark:text-white">Your hamper is ready</h2><p className="text-sm text-ink-700/60 dark:text-gray-300">A personal gift, packed just for them.</p></div></div><div className="mt-7 rounded-2xl bg-cream-100/60 p-5 dark:bg-gray-900"><p className="font-display text-lg text-wine-700 dark:text-gold-300">{boxes[box].name}</p><p className="mt-2 text-sm text-ink-700/65 dark:text-gray-300">{selected.length ? selected.join(', ') : 'Your selected hamper essentials'}</p>{message && <p className="mt-4 border-l-2 border-gold-500 pl-3 text-sm italic text-ink-700/70 dark:text-gray-300">“{message}”</p>}</div>{added && <p className="mt-4 rounded-xl bg-sage-500/15 px-4 py-3 text-sm text-sage-500">Your custom hamper has been added to the cart.</p>}</div>}
          <div className="mt-10 flex items-center justify-between border-t border-cream-200 pt-6 dark:border-gray-700"><button disabled={step === 0} onClick={() => setStep((current) => current - 1)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-40"><ArrowLeft className="h-4 w-4" />Back</button>{step === steps.length - 1 ? <button onClick={addToCart} className="inline-flex items-center gap-2 rounded-full bg-wine-600 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-wine-700"><PackagePlus className="h-4 w-4" />Add to cart</button> : <button onClick={() => setStep((current) => current + 1)} className="inline-flex items-center gap-2 rounded-full bg-wine-600 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-wine-700">Continue<ArrowRight className="h-4 w-4" /></button>}</div>
        </section>
        <aside className="h-fit rounded-3xl bg-cream-50 p-6 ring-1 ring-cream-200 lg:sticky lg:top-24 dark:bg-gray-800 dark:ring-gray-700"><p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">Running total</p><p className="mt-2 font-display text-4xl font-semibold text-wine-800 dark:text-white">{formatPrice(total)}</p><div className="my-5 border-t border-cream-200 dark:border-gray-700" /><dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-ink-700/60 dark:text-gray-300">{boxes[box].name}</dt><dd>{formatPrice(boxes[box].price)}</dd></div>{extras.filter((item) => selected.includes(item.name)).map((item) => <div key={item.name} className="flex justify-between gap-3"><dt className="text-ink-700/60 dark:text-gray-300">{item.name}</dt><dd>{formatPrice(item.price)}</dd></div>)}<div className="flex justify-between gap-3"><dt className="text-ink-700/60 dark:text-gray-300">{wrapping}</dt><dd>Free</dd></div></dl></aside>
      </div>
    </main>
  </div>;
}

function ChoiceStep({ title, options, selected, onSelect }: { title: string; options: { label: string; detail: string }[]; selected: number; onSelect: (index: number) => void }) {
  return <div><h2 className="font-display text-2xl font-semibold text-wine-700 dark:text-white">{title}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{options.map((option, index) => <button key={option.label} onClick={() => onSelect(index)} className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left text-sm transition-colors ${selected === index ? 'border-wine-600 bg-wine-600/5' : 'border-cream-300 hover:border-gold-400 dark:border-gray-700'}`}><span>{option.label}</span><span className="shrink-0 text-ink-700/60 dark:text-gray-300">{option.detail}</span></button>)}</div></div>;
}
