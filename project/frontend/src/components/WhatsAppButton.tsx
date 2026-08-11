export default function WhatsAppButton() {
  const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '916386256770';
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');

  const defaultMessage = 'Hello A_S Hamper! I would like to inquire about personalized gift hampers.';
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end pointer-events-auto select-none font-sans">
      {/* Floating WhatsApp Button without default notification text */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white shadow-[0_10px_25px_-5px_rgba(37,211,102,0.5)] transition-all duration-300 hover:scale-110 hover:shadow-[0_15px_30px_-5px_rgba(37,211,102,0.7)] active:scale-95 ring-2 ring-[#25D366]/20 p-1"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        {/* Subtle Pulsing Outer Ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none group-hover:opacity-0" />

        {/* Flaticon WhatsApp Icon PNG */}
        <img
          src="https://cdn-icons-png.flaticon.com/128/3670/3670051.png"
          alt="WhatsApp"
          className="h-11 w-11 sm:h-13 sm:w-13 object-contain transition-transform duration-300 group-hover:rotate-6"
        />
      </a>
    </div>
  );
}
