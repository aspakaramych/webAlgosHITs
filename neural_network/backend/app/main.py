import json
import numpy as np
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .nn.neural_network import predict, create_model

PATH = "./app/weights/weights.json"

app = FastAPI()
model = create_model(PATH)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*']
)


@app.post("/predict")
async def get_prediction(data=Body()):
    decoded_data = data.decode("utf-8")
    parsed_data = json.loads(decoded_data)
    num_array = np.array(parsed_data["data"]).astype(np.uint8)
    num = predict(num_array, model)
    return num


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)