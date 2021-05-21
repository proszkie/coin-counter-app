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

  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCREEN_HEIGHT = useWindowDimensions().height;

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

  return (
    <View style={styles.container}>
      <Camera ref={(ref) => setCamera(ref)} style={{height: height, width: "100%"}} ratio="16:9" type={type}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={
              isWaiting
                ? [buttonStyle(), styles.overlay]
                : [buttonStyle()]
            }
            onPress={async () => {
              if (isWaiting) {
                return;
              }
              Speech.speak("Gimme one moment, I'll calculate it...");
              setIsWaiting(true);
              let photo = await camera?.takePictureAsync({ base64: true });
              const base64: string = photo?.base64!;
              let photo_as_bytes = Buffer.from(base64, "base64");
              let response = await fetch(
                "http://192.168.8.112:8080/anotation",
                {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/octet-stream",
                  },
                  body: photo_as_bytes,
                }
              );
              let data = (await response.json()) as ApiResponse;
              setIsWaiting(false);
              console.log(data);
              if (data.sum != 0) {
                Speech.speak("There is " + data.sum + " " + data.denomination);
              } else {
                Speech.speak("No money was recognized");
              }
            }}
          >
            <ActivityIndicator
              style={styles.spinner}
              animating={isWaiting}
              color="#0000ff"
              size={100}
            />
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
});

export default CameraView;
