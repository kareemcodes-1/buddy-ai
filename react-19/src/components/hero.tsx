import { FaMicrophone } from "react-icons/fa";
import { FaSquare } from "react-icons/fa";
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
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notion/create`, {
    method: "POST",
    body: JSON.stringify({ content: text, section }),
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

const speak = (text: string) => {
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";

  const assignVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();

    // Pick a female/Google US English voice if available
    const femaleVoice = voices.find(
      (v) =>
        v.lang === "en-US" &&
        (v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("woman") ||
          v.name.toLowerCase().includes("victoria") ||
          v.name.toLowerCase().includes("google us english"))
    );

    if (femaleVoice) utterance.voice = femaleVoice;

    // ✅ Instead of cancel() first, just stop current and then speak
    window.speechSynthesis.cancel(); // clear previous
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50); // tiny delay helps iOS
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    // Safari/iOS loads voices async
    window.speechSynthesis.onvoiceschanged = assignVoiceAndSpeak;
  } else {
    assignVoiceAndSpeak();
  }
};


const Hero = () => {
  const speechRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(""); // only final transcript
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
    const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    recognition.continuous = false; // required for iOS

    recognition.onstart = () => setIsListening(true);

    // store final result in a variable
    let finalTranscriptTemp = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptTemp += result[0].transcript + " ";
        }
      }
    };

    recognition.onerror = (e) => console.error("Speech recognition error:", e.error);

   recognition.onend = () => {
      setIsListening(false);

      if (finalTranscriptTemp.trim()) {
        setTranscript(finalTranscriptTemp.trim());
        setShowTranscript(true);

        // animate fade-out after 3 seconds
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = setTimeout(() => {
          setShowTranscript(false);
          // remove text after fade duration (700ms)
          setTimeout(() => setTranscript(""), 700);
        }, 3000);

        // send to backend after stopping
        (async () => {
          const prediction = await predictIntent(finalTranscriptTemp.trim());
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
        })();
      }
    };

    recognition.start();
    speechRef.current = recognition;
  };

  const stopListening = () => {
    speechRef.current?.stop();
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  useEffect(() => {
    if (transcript && textRef.current) {
      const split = new SplitText(textRef.current, { type: "words" });
      gsap.from(split.words, {
        y: 50,
        opacity: 0,
        stagger: 0.05,
        duration: 0.4,
        ease: "power3.out",
      });
      return () => split.revert();
    }
  }, [transcript]);

  return (
    <section className="bg-black text-white h-screen flex flex-col items-center justify-center">
      <h1 className="lg:text-[4rem] text-[3.5rem] opacity-[.8]">Luna AI</h1>
      <div id="atom">
        <div id="nucleus" className={`${isListening && "start"}`}></div>
      </div>

      <button
        onClick={toggleListening}
        className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg active:scale-95 transition-transform"
      >
        {isListening ? <FaSquare className="text-[1.4rem]"/> : <FaMicrophone className="text-[1.4rem]" />}
      </button>

      <p
        ref={textRef}
        className={`mb-4 mt-[1rem] capitalize transition-opacity duration-700 text-white opacity-[.8]`}
        style={{
          fontSize: "clamp(1.5rem, 5vw, 3rem)",
          textAlign: "center",
          wordBreak: "break-word",
          maxWidth: "90vw",
          opacity: showTranscript ? 1 : 0,
        }}
      >
        {transcript}
      </p>
    </section>
  );
};

export default Hero;
