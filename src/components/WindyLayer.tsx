import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function WindyLayer() {
    const map = useMap();

    useEffect(() => {
        // --- LOGIC DÒNG GIÓ SẼ ĐẶT Ở ĐÂY ---
        // Tạm thời hiển thị một thông báo trên console
        console.log("Wind Layer Activated: Logic for rendering wind particles goes here.");

        return () => {
            // Dọn dẹp layer khi bị tắt
            console.log("Wind Layer Deactivated.");
        };
    }, [map]);

    return null; 
}