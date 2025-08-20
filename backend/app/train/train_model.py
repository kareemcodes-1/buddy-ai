import json
import pickle
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.utils import to_categorical
from pathlib import Path
from tensorflow.keras.layers import Embedding, GlobalAveragePooling1D, GlobalMaxPooling1D, Dense, Dropout, Concatenate, Input
from tensorflow.keras.models import Model

DATA_PATH = Path("app/train/intents.json")
MODEL_DIR = Path("app/model")
MODEL_FILE = MODEL_DIR / "intent_model.keras" 
TOKENIZER_FILE = MODEL_DIR / "tokenizer.pickle"
META_FILE = MODEL_DIR / "meta.pickle"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

patterns = []
labels = []
label_index = {}
for i, intent in enumerate(data["intents"]):
    label_index[intent["tag"]] = i
    for p in intent["patterns"]:
        patterns.append(p)
        labels.append(i)


tokenizer = Tokenizer(oov_token="<OOV>")
tokenizer.fit_on_texts(patterns)
sequences = tokenizer.texts_to_sequences(patterns)
maxlen = max(len(s) for s in sequences)

X = pad_sequences(sequences, maxlen=maxlen, padding="post")
y = to_categorical(labels, num_classes=len(label_index))

vocab_size = len(tokenizer.word_index) + 1
num_classes = len(label_index)


input_layer = Input(shape=(maxlen,))
embedding = Embedding(input_dim=vocab_size, output_dim=32, input_length=maxlen)(input_layer)


avg_pool = GlobalAveragePooling1D()(embedding)
max_pool = GlobalMaxPooling1D()(embedding)

# Combine both pooling results
concat = Concatenate()([avg_pool, max_pool])

# Dense layers
dense1 = Dense(64, activation="relu")(concat)
dropout = Dropout(0.2)(dense1)
output_layer = Dense(num_classes, activation="softmax")(dropout)

# Build model
model = Model(inputs=input_layer, outputs=output_layer)

model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
model.fit(X, y, epochs=200, batch_size=4, validation_split=0.1, verbose=1)

# 5. Save model + tokenizer + meta
model.save(MODEL_FILE.as_posix())  # ✅ saves in Keras v3 format
with open(TOKENIZER_FILE, "wb") as f:
    pickle.dump(tokenizer, f)
with open(META_FILE, "wb") as f:
    pickle.dump({"maxlen": maxlen, "label_index": label_index}, f)

print("Saved model to:", MODEL_FILE)
