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
  const [setLoading] = useState(false);
  const textRef = useRef<HTMLParagraphElement | null>(null);

  
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
  recognition.continuous = true;

  recognition.onstart = () => {
    setIsListening(true);
    setTranscript("");
  };


recognition.onstart = () => {
  setIsListening(true);
  setTranscript("");
  lastProcessedTranscript.current = "";
};

recognition.onresult = async (event: SpeechRecognitionEvent) => {
  const currentTranscript = Array.from(event.results)
    .map((res) => res[0].transcript)
    .join(" ")
    .trim();  // Trim spaces here!

  if (event.results[event.results.length - 1].isFinal) {
    // Only proceed if this transcript is different from last processed one
    if (lastProcessedTranscript.current !== currentTranscript) {
      lastProcessedTranscript.current = currentTranscript;
      setTranscript(currentTranscript);

      setLoading(true);


      const prediction = await predictIntent(currentTranscript);
      console.log(prediction);

      setLoading(false);

      if (prediction?.confidence > 0.85 && prediction?.response) {
        speak(prediction.response);

        if (prediction.intent === "create_todo" && prediction.target) {
          await createTodo({ text: prediction.task_text, section: prediction.target });
        }
      } else {
        speak("Sorry, I didn't quite get that.");
      }
    }
  }

  if (silenceTimer.current) clearTimeout(silenceTimer.current);
  silenceTimer.current = setTimeout(() => recognition.stop(), 2000);
};



  recognition.onerror = (e) => {
    console.error("Speech recognition error:", e.error);
    setIsListening(false);
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  recognition.start();
  speechRef.current = recognition;
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

      {!isListening && (
        <button
          onClick={startListening}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg transition-transform transform hover:scale-110"
        >
          <Mic />
        </button>
      )}

      {isListening && (
        <p
  ref={textRef}
  className="mb-4 text-gray-400 capitalize"
  style={{
    fontSize: "clamp(1rem, 5vw, 3rem)", // min, preferred, max
    textAlign: "center",
    wordBreak: "break-word",
    maxWidth: "90vw",
  }}
>
  {transcript ? transcript : "I'm Listening..."}
</p>

      )}

       {/* {loading && (
    <p className="my-4 lg:text-[3rem] text-[2.5rem] text-gray-400 capitalize">
      Processing your request...
    </p>
  )} */}
    </section>
  );
};

export default Hero;
