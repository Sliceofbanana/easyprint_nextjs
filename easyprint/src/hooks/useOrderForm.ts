import { useState, useCallback } from 'react';

export interface OrderFormData {
  paperSize: string;
  printMode: string;
  copies: number;
  binding: string;
  lamination: {
    enabled: boolean;
    micron: number;
    size: string;
    qty: number;
  };
  rushPackage: string;
  deliveryType: string;
  deliveryLocation: string;
  specialInstructions: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

export interface PaymentProof {
  file: File | null;
  ref: string;
  url: string;
}

const initialFormData: OrderFormData = {
  paperSize: 'a4',
  printMode: 'black',
  copies: 1,
  binding: 'none',
  lamination: { enabled: false, micron: 125, size: 'a4', qty: 0 },
  rushPackage: '',
  deliveryType: 'campus',
  deliveryLocation: '',
  specialInstructions: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

export const useOrderForm = () => {
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentProof, setPaymentProof] = useState<PaymentProof>({
    file: null,
    ref: '',
    url: '',
  });

  const updateFormData = useCallback(
    (updates: Partial<OrderFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const updatePaymentProof = useCallback(
    (updates: Partial<PaymentProof>) => {
      setPaymentProof((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setPaymentProof({ file: null, ref: '', url: '' });
  }, []);

  return {
    formData,
    updateFormData,
    currentStep,
    nextStep,
    prevStep,
    paymentProof,
    updatePaymentProof,
    resetForm,
  };
};