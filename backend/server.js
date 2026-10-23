
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase settings in .env");
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Christ Is the Answer Group API is running",
        status: "OK"
    });
});

// Get all Bible presentation records
app.get("/presentations", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("presentations")
            .select("*")
            .order("presentation_date", { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error("Read error:", error.message);
        res.status(500).json({
            error: "Could not load presentations"
        });
    }
});

// Save a Bible presentation
app.post("/presentations", async (req, res) => {
    try {
        const {
            presentation_date,
            presenter_name,
            whatsapp,
            bible_book,
            verses,
            topic,
            notes,
            lessons
        } = req.body;

        if (
            !presentation_date ||
            !presenter_name?.trim() ||
            !bible_book?.trim() ||
            !verses?.trim() ||
            !topic?.trim()
        ) {
            return res.status(400).json({
                error: "Date, presenter, Bible book, verses and topic are required"
            });
        }

        const date = new Date(`${presentation_date}T12:00:00Z`);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== presentation_date ||
            date.getUTCDay() !== 6
        ) {
            return res.status(400).json({
                error: "Please choose a valid Saturday"
            });
        }

        const { data, error } = await supabase
            .from("presentations")
            .insert([{
                presentation_date,
                presenter_name: presenter_name.trim(),
                whatsapp: whatsapp || null,
                bible_book: bible_book.trim(),
                verses: verses.trim(),
                topic: topic.trim(),
                notes: notes || null,
                lessons: lessons || null
            }])
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return res.status(409).json({
                    error: "This Saturday is already reserved"
                });
            }

            throw error;
        }

        res.status(201).json({
            message: "Presentation saved successfully",
            presentation: data
        });
    } catch (error) {
        console.error("Save error:", error.message);
        res.status(500).json({
            error: "Could not save presentation"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Christ Is the Answer API running on port ${PORT}`);
});
