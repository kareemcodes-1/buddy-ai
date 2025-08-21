import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);


const predictIntent = async (text: string) => {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/predict`, {
    method: "POST",
    body: JSON.stringify({ text }),
    headers: { "Content-Type": "application/json" },
  });
  return res.ok ? res.json() : null;
};

const createTodo = async ({
  text,
  section,
}: {
  text: string;
  section: string;
}) => {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/notion/create`,
    {
      method: "POST",
      body: JSON.stringify({ content: text, section }),
      headers: { "Content-Type": "application/json" },
    }
  );
  return res.json();
};

const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";

  // Pick a female voice if available
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(
    (v) =>
      v.lang === "en-US" &&
      (v.name.toLowerCase().includes("female") ||
       v.name.toLowerCase().includes("woman") ||
       v.name.toLowerCase().includes("victoria") || // common macOS voice
       v.name.toLowerCase().includes("google us english"))
  );
  
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

};

const Hero = () => {
  const speechRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);


  
  const lastProcessedTranscript = useRef<string>("");

  

const startListening = () => {
  const SR =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  if (!SR) {
    alert("Your browser does not support speech recognition.");
    return;
  }

  const recognition: SpeechRecognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false; // only while holding

  recognition.onstart = () => {
    setIsListening(true);
    setTranscript("");
    lastProcessedTranscript.current = "";
  };

recognition.onresult = async (event: SpeechRecognitionEvent) => {
  let currentTranscript = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    currentTranscript += event.results[i][0].transcript;
  }

  currentTranscript = currentTranscript.trim();
  setTranscript(currentTranscript);

  if (currentTranscript) {
    setShowTranscript(true); // 👈 show transcript immediately
  }

  if (event.results[event.results.length - 1].isFinal) {
    if (lastProcessedTranscript.current !== currentTranscript) {
      lastProcessedTranscript.current = currentTranscript;

      const prediction = await predictIntent(currentTranscript);

      if (prediction?.confidence > 0.85 && prediction?.response) {
        speak(prediction.response);

        if (prediction.intent === "create_todo" && prediction.target) {
          await createTodo({
            text: prediction.task_text,
            section: prediction.target,
          });
        }
      } else {
        speak("Sorry, I didn't quite get that.");
      }
    }
  }
};



  recognition.onerror = (e) => {
    console.error("Speech recognition error:", e.error);
    setIsListening(false);
  };

  recognition.onend = () => {
  setIsListening(false);

  // Hide transcript after 2s
  if (transcript) {
    setTimeout(() => {
      setShowTranscript(false);

      // Clear the actual text a bit after fade-out
      setTimeout(() => {
        setTranscript("");
      }, 700); // match your transition duration (700ms)
    }, 2000);
  }
};


  recognition.start();
  speechRef.current = recognition;
};

const stopListening = () => {
  speechRef.current?.stop();
};




  useEffect(() => {
     window.speechSynthesis.onvoiceschanged = () => {
    console.log("Available voices:", window.speechSynthesis.getVoices());
    };
    return () => {
      speechRef.current?.stop();
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, []);

  useEffect(() => {
  if (transcript && textRef.current) {
    // Split text into words
    const split = new SplitText(textRef.current, { type: "words" });

    // Animate each word
    gsap.from(split.words, {
      y: 50,
      opacity: 0,
      stagger: 0.1,
      duration: 0.5,
      ease: "power3.out"
    });

    // Cleanup to avoid duplicate spans when text changes
    return () => {
      split.revert();
    };
  }
}, [transcript]);

  return (
    <section className="bg-black text-white h-screen flex flex-col items-center justify-center">
      <h1 className="lg:text-[4rem] text-[3.5rem] opacity-[.8]">Luna AI</h1>
      <div id="atom">
        <div id="nucleus" className={`${isListening && "start"}`}></div>
      </div>


  <button
    onMouseDown={startListening}
    onMouseUp={stopListening}
    onTouchStart={startListening}
    onTouchEnd={stopListening}
    className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg active:scale-95 transition-transform"
  >
    <Mic />
  </button>

<p
  ref={textRef}
  className={`mb-4 capitalize transition-opacity duration-700 ${
    isListening ? "text-gray-200" : "text-gray-500"
  }`}
  style={{
    fontSize: "clamp(1rem, 5vw, 3rem)",
    textAlign: "center",
    wordBreak: "break-word",
    maxWidth: "90vw",
    opacity: showTranscript ? 1 : 0, // 👈 fade out after 2s
  }}
>
  {transcript}
</p>




       {/* {loading && (
    <p className="my-4 lg:text-[3rem] text-[2.5rem] text-gray-400 capitalize">
      Processing your request...
    </p>
  )} */}
    </section>
  );
};

export default Hero;
