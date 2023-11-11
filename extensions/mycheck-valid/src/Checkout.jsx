import {
  reactExtension,
  TextField,
  Text,
  Grid,
  GridItem,
  View,
  useExtensionCapability,
  useBuyerJourneyIntercept,
} from "@shopify/ui-extensions-react/checkout";
import { withAppBridge } from '@shopify/app-bridge-react';
import React, { useState } from "react";
import axios from 'axios';
import fetch from 'isomorphic-fetch';
// Set the entry point for the extension
export default reactExtension("purchase.checkout.contact.render-after", () => <App />);

function App() {
  // Set the target age that a buyer must be to complete an order
  const ageTarget = 18;

  // Set up the app state
  const [address, setAddress] = useState("");
  const [validationAddressError, setValidationAddressError] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [validationPhoneNumberError, setValidationPhoneNumberError] = useState(""); 

  const [city, setCity] = useState('');
  const [validationCityError, setValidationCityError] = useState("");

  const [postalCode, setPostalCode] = useState('');
  const [validationPostalCodeError, setValidationPostalCodeError] = useState("");

  const handleVerifyPostalCode = async () => {      
    // Make API request to verify postal code
    return await fetch(`https://app.zipcodebase.com/api/v1/search?apikey=97af22b0-806c-11ee-ba55-1be5b36e30c5&codes=${postalCode}`)
      .then(response => {
        // Check if the response was successful
        if (!response.ok) {
          throw new Error('API request failed');
        }
    
        // Read and parse the response body as JSON
        return response.json();
      })
      .then(data => {
        console.log(data.results[`${postalCode}`]);
        const isValid = data.results[`${postalCode}`].find(item => item.city === city);
        if (isValid) {
          console.log('Postal code is valid');
          return true;
          // Perform actions when postal code is valid
        } else {
          console.error('Postal code is invalid');
          setValidationPostalCodeError("Please enter correct postal code for your city")
          return false;
          // Perform actions when postal code is invalid
        }
      })
      .catch(error => {
        console.error('Error occurred during postal code verification:', error);
        return false;
      });
  };
  // Merchants can toggle the `block_progress` capability behavior within the checkout editor
  const canBlockProgress = useExtensionCapability("block_progress");
  const label = canBlockProgress ? "Your address" : "Your address (optional)";
  // Use the `buyerJourney` intercept to conditionally block checkout progress
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    handleVerifyPostalCode().then(data => {
      if (canBlockProgress && !data) {
        return {
          behavior: "block",
          reason: "Postal Code invalid",
          perform: (result) => {
            if (result.behavior === "block") {
              if (!data) {
                setValidationPostalCodeError("Enter cprrect postal code for your city")
              }
            }
          }
        }
      }
    })
    // Validate that the age of the buyer is known, and that they're old enough to complete the purchase
    if (canBlockProgress && (!isAddressSet() || !isPhoneNumberValid() || !isCityValid())) {
      return {
        behavior: "block",
        reason: "Address is required",
        perform: (result) => {
          // If progress can be blocked, then set a validation error on the custom field
          if (result.behavior === "block") {
            if (!isAddressSet()) {
              setValidationAddressError("Please enter your address");
            }

            if (!isPhoneNumberValid()) {
              setValidationPhoneNumberError("Please enter correct phone number");
            }

            if (!isCityValid()) {
              setValidationCityError("Please enter your city");
            }
          }
        },
      };
    }

    if (canBlockProgress && !isAddressValid()) {
      return {
        behavior: "block",
        reason: `Invalid address`,
        errors: [
          {
            // Show a validation error on the page
            message:
              "Please fill correct address.",
          },
        ],
      };

      
    }

    return {
      behavior: "allow",
      perform: () => {
        // Ensure any errors are hidden
        clearValidationErrors();
      },
    };
  });
  function isAddressSet() {
    return address !== "";
  }

  function isAddressValid() {
    const regex = /[0-9]/;

    return address.length > 5 && regex.test(address);
  }

  function isPhoneNumberValid() {
    return phoneNumber.length === 10;
  }

  function isCityValid() {
    return city !== "";
  }

  function clearValidationErrors() {
    setValidationAddressError("");
    setValidationPhoneNumberError("");
    setValidationPostalCodeError("");
    setValidationCityError("");
  }
  // Render the extension
  return (
    <>
      <TextField
        label={label}
        type="text"
        value={address}
        onChange={setAddress}
        onInput={clearValidationErrors}
        required={canBlockProgress}
        error={validationAddressError}
        style={{ borderRadius: '5px', color: 'blue' }}
      />
      <Text>Phone</Text>
      <TextField
        label="Phone Number"
        type="number"
        value={phoneNumber}
        onChange={setPhoneNumber}
        onInput={clearValidationErrors}
        required={canBlockProgress}
        error={validationPhoneNumberError}
      />
     <Grid
      columns={['50%', '50%']}
      rows={['auto']}
      spacing="loose"
    >
      <View border="base" padding="base">
        <TextField
          label="Postal Code"
          type="number"
          value={postalCode}
          onChange={setPostalCode}
          onInput={clearValidationErrors}
          required={canBlockProgress}
          error={validationPostalCodeError}
        />
      </View>
      <View border="base" padding="base">
        <TextField
          label="City"
          type="text"
          value={city}
          onChange={setCity}
          onInput={clearValidationErrors}
          required={canBlockProgress}
          error={validationCityError}
        />
      </View>
    </Grid>
    </>
    
  );
}
