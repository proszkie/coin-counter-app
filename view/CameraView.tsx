import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Camera } from "expo-camera";
import * as Speech from "expo-speech";
import { Buffer } from "buffer";
import { useWindowDimensions } from "react-native";

const CameraView = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const type = Camera.Constants.Type.back;
  const [camera, setCamera] = useState<Camera | null>(null);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCREEN_HEIGHT = useWindowDimensions().height;
  const controller = new AbortController();
  const { signal } = controller;

  function buttonStyle() {
    return {
      alignItems: "center",
      justifyContent: "center",
      width: SCREEN_WIDTH,
    };
  }

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const height = Math.round((SCREEN_WIDTH * 16) / 9);
  const marginTop = (SCREEN_HEIGHT - height) / 1.5;

  const textResult =
    result == null ? null : (
      <Text style={styles.result}>
        {result?.sum + "\n"}
        {result?.denomination}
      </Text>
    );

  return (
    <View style={styles.container}>
      <Camera
        ref={(ref) => setCamera(ref)}
        style={{ height: height, width: "100%", marginTop: marginTop }}
        ratio="16:9"
        type={type}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={
              isWaiting ? [buttonStyle(), styles.overlay] : [buttonStyle()]
            }
            onPress={async () => {
              if (isWaiting) {
                Speech.speak("Request has been cancelled");
                controller.abort();
                setIsWaiting(false);
                return;
              }
              if (result) {
                setResult(null);
                return;
              }
              Speech.speak("Gimme one moment, I'll calculate it...");
              setIsWaiting(true);
              let photo = await camera?.takePictureAsync({ base64: true });
              const base64: string = photo?.base64!;
              let photo_as_bytes = Buffer.from(base64, "base64");
              fetch(
                "http://192.168.8.112:8080/anotation",
                {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/octet-stream",
                  },
                  body: photo_as_bytes,
                  signal: signal,
                }
              )
                .then((response) => response.json())
                .then((response) => {
                  let data = response as ApiResponse;
                  setIsWaiting(false);
                  setResult(data);
                  if (data.sum != 0) {
                    Speech.speak(
                      "There is " + data.sum + " " + data.denomination
                    );
                  } else {
                    Speech.speak("No money was recognized");
                  }
                })
                .catch((e) => {
                  if (e.name === "AbortError") {
                    console.log("Request cancelled");
                  }
                });
            }}
          >
            <ActivityIndicator
              style={styles.spinner}
              animating={isWaiting}
              color="#0000ff"
              size={100}
            />
            {textResult}
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

type ApiResponse = {
  sum: number;
  denomination: string;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    backgroundColor: "transparent",
    flexDirection: "row",
    flex: 1,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {},
  overlay: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  result: {
    color: "yellow",
    fontSize: 120,
    textAlign: "center",
  },
});

export default CameraView;
